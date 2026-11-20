/** Immutable revisions with explicit parents. Conflicting heads remain addressable. */
export interface SyncRevision {
    id: string;
    parents: string[];
    value: unknown;
}
export interface SyncFile {
    format: 1;
    records: Record<string, SyncRevision[]>;
}
export type SyncCheckpoint = Record<
    string,
    { rev: string; fingerprint: string }
>;
export interface SyncAdapter {
    read(): Promise<Map<string, unknown>>;
    apply(id: string, value: unknown): Promise<void>;
    checkpoint(): Promise<SyncCheckpoint>;
    acknowledge(next: SyncCheckpoint): Promise<void>;
    /** Physical library items require explicit local deletion. */
    protectedRemoval?: boolean;
}

export function heads(revisions: SyncRevision[]) {
    const parents = new Set(revisions.flatMap((r) => r.parents));
    return revisions.filter((r) => !parents.has(r.id));
}
export function canonical(value: unknown): string {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object")
        return (
            "{" +
            Object.entries(value)
                .filter(([, v]) => v !== undefined)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
                .join(",") +
            "}"
        );
    return JSON.stringify(value);
}
async function digest(value: unknown) {
    const bytes = new TextEncoder().encode(canonical(value));
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), (v) =>
        v.toString(16).padStart(2, "0"),
    ).join("");
}
export function endpoint(base: string, kind: "chats" | "actions" | "tables") {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash)
        throw new Error(
            "Enter a WebDAV directory URL without embedded credentials",
        );
    if (
        url.protocol !== "https:" &&
        !(
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        )
    )
        throw new Error("WebDAV requires HTTPS or a loopback server");
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    return new URL("AsterMargin/" + kind + ".json", url);
}
export interface Conflict {
    id: string;
    heads: SyncRevision[];
}
export async function syncDataset(
    url: URL,
    auth: string,
    adapter: SyncAdapter,
    request: typeof fetch = fetch,
    resolutions: Record<string, string> = {},
): Promise<Conflict[]> {
    const headers: Record<string, string> = auth ? { Authorization: auth } : {};
    const send = (target: URL, init: RequestInit = {}) =>
        request(target.href, {
            ...init,
            redirect: "error",
            credentials: "omit",
            headers: { ...headers, ...init.headers },
        });
    const mk = await send(new URL(".", url), { method: "MKCOL" });
    if (!mk.ok && mk.status !== 405)
        throw new Error("WebDAV MKCOL: " + mk.status);
    const local = await adapter.read(),
        seen = await adapter.checkpoint();
    for (let attempt = 0; attempt < 4; attempt++) {
        const response = await send(url);
        if (!response.ok && response.status !== 404)
            throw new Error("WebDAV GET: " + response.status);
        const remote: SyncFile =
            response.status === 404
                ? { format: 1, records: {} }
                : ((await response.json()) as unknown as SyncFile);
        if (
            remote.format !== 1 ||
            !remote.records ||
            typeof remote.records !== "object" ||
            Array.isArray(remote.records)
        )
            throw new Error("Unrecognized WebDAV data");
        const records = new Map(Object.entries(remote.records)),
            updates = new Map<string, SyncRevision>(),
            conflicts: Conflict[] = [];
        const checkpoint = { ...seen };
        let changed = false;
        for (const id of new Set([
            ...local.keys(),
            ...records.keys(),
            ...Object.keys(seen),
        ])) {
            if (["__proto__", "constructor", "prototype"].includes(id))
                throw new Error("Invalid record id");
            const revisions = records.get(id) ?? [];
            if (
                !Array.isArray(revisions) ||
                revisions.some(
                    (r) =>
                        !r ||
                        !Array.isArray(r.parents) ||
                        typeof r.id !== "string",
                )
            )
                throw new Error("Invalid revision");
            const has = local.has(id),
                value = has ? local.get(id) : null,
                fp = await digest(value),
                previous = seen[id];
            let current = heads(revisions);
            if (adapter.protectedRemoval && previous && !has) continue;
            const resolved =
                resolutions[id] &&
                current.find((r) => r.id === resolutions[id]);
            if (resolutions[id] && !resolved)
                throw new Error("Conflict changed; reload before choosing");
            let next: SyncRevision | undefined;
            if (resolved) {
                const parents = current.map((r) => r.id).sort();
                next = {
                    id: await digest([id, parents, resolved.value]),
                    parents,
                    value: resolved.value,
                };
            } else if (
                (previous && fp !== previous.fingerprint) ||
                (!previous && has)
            ) {
                const same = current.find(
                    (r) => canonical(r.value) === canonical(value),
                );
                if (!same) {
                    const parents = previous ? [previous.rev] : [];
                    next = {
                        id: await digest([id, parents, value]),
                        parents,
                        value,
                    };
                }
            }
            if (next && !revisions.some((r) => r.id === next!.id)) {
                revisions.push(next);
                records.set(id, revisions);
                changed = true;
            }
            current = heads(revisions);
            if (current.length > 1) {
                conflicts.push({ id, heads: current });
                continue;
            }
            if (current.length === 1) {
                const winner = current[0];
                updates.set(id, winner);
                checkpoint[id] = {
                    rev: winner.id,
                    fingerprint: await digest(winner.value),
                };
            }
        }
        if (changed) {
            const etag = response.headers.get("etag");
            if (response.ok && (!etag || etag.startsWith("W/")))
                throw new Error(
                    "WebDAV must provide strong ETags for concurrent editing",
                );
            const write = await send(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(response.status === 404
                        ? { "If-None-Match": "*" }
                        : { "If-Match": etag! }),
                },
                body: JSON.stringify({
                    format: 1,
                    records: Object.fromEntries(records),
                }),
            });
            if (write.status === 412) continue;
            if (!write.ok) throw new Error("WebDAV PUT: " + write.status);
        }
        const latest = await adapter.read();
        for (const [id, rev] of updates) {
            const now = latest.get(id) ?? null,
                before = local.get(id) ?? null;
            if (canonical(now) !== canonical(before))
                throw new Error("Local record changed. Sync again to merge.");
            if (canonical(now) !== canonical(rev.value))
                await adapter.apply(id, rev.value);
        }
        await adapter.acknowledge(checkpoint);
        return conflicts;
    }
    throw new Error("WebDAV changed repeatedly. Sync again.");
}
