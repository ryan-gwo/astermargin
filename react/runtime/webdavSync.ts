import {
    canonical,
    endpoint,
    syncDataset,
    type Conflict,
    type SyncAdapter,
    type SyncCheckpoint,
} from "../../src/services/webdav";
import {
    getActionCustomizations,
    saveActionCustomizations,
    isLockedBuiltinAction,
} from "../types/actionStorage";
import {
    isStoredAction,
    normalizeStoredAction,
    normalizeStoredOverride,
} from "@astermargin/agent-core/types/actions";
import { visitLibraryReferences } from "../../src/services/artifacts/artifactProvider";
import {
    createTable,
    readTable,
    writeTable,
} from "../../src/services/artifacts/tableStore";
import { loadIsTableAttachment } from "../../src/services/artifacts/tableItemIdentity";
import { readSpec } from "@astermargin/agent-core/layouts/table";
import {
    libraryRefForLibraryID,
    resolveLibraryRef,
} from "../../src/utils/libraryIdentity";
import type { AgentRun } from "@astermargin/agent-core/agents/types";

export type Dataset = "chats" | "actions" | "tables";
const prefix = "extensions.zotero.astermargin.sync.";
export const readSetting = (name: string) =>
    String(Zotero.Prefs.get(prefix + name, true) || "");
export const writeSetting = (name: string, value: string) =>
    Zotero.Prefs.set(prefix + name, value, true);
const history = () => Zotero.AsterMargin.db.localHistory;
const aliases = () =>
    JSON.parse(readSetting("tableAliases") || "{}") as Record<string, string>;

function perm(library: number) {
    if (
        !Zotero.AsterMargin.libraryScopeInitialized ||
        !Zotero.AsterMargin.searchableLibraryIds?.includes(library)
    )
        throw new Error("Library is excluded or unavailable");
}
function scopedRun(run: AgentRun) {
    const scope = (run as AgentRun & { local_library_scope?: number[] })
        .local_library_scope;
    if (!Array.isArray(scope))
        throw new Error("This chat predates library-scope tracking");
    scope.forEach(perm);
}
/** Persist portable library references. Device-local SQLite IDs can differ. */
function portableRun(run: AgentRun, decode = false): AgentRun {
    const walk = (node: any): any => {
        if (Array.isArray(node)) return node.map(walk);
        if (!node || typeof node !== "object") return node;
        const out = Object.fromEntries(
            Object.entries(node).map(([k, v]) => [k, walk(v)]),
        );
        if (decode && out.library_ref) {
            const lib = resolveLibraryRef({ library_ref: out.library_ref });
            if (!lib) throw new Error("Referenced library unavailable");
            perm(lib);
            out.library_id = lib;
        } else if (
            !decode &&
            typeof out.library_id === "number" &&
            out.library_id > 0
        ) {
            perm(out.library_id);
            const ref = libraryRefForLibraryID(out.library_id);
            if (!ref) throw new Error("Library has no portable reference");
            out.library_ref = ref;
            delete out.library_id;
        }
        return out;
    };
    const mapped = walk(run);
    if (decode) {
        if (!Array.isArray(mapped.local_library_refs))
            throw new Error("Missing portable library scope");
        mapped.local_library_scope = mapped.local_library_refs.map(
            (r: string) => {
                const lib = resolveLibraryRef({ library_ref: r });
                if (!lib) throw new Error("Library unavailable");
                perm(lib);
                return lib;
            },
        );
        delete mapped.local_library_refs;
    } else {
        scopedRun(run);
        mapped.local_library_refs = (run.local_library_scope ?? []).map((id) =>
            libraryRefForLibraryID(id),
        );
        delete mapped.local_library_scope;
    }
    return mapped;
}
function adapter(kind: Dataset, checkpointKey: string): SyncAdapter {
    let tableRefs = new Map<
        string,
        { libraryID: number; key: string; version: number }
    >();
    return {
        protectedRemoval: kind === "tables",
        async read() {
            const rows = new Map<string, unknown>();
            if (kind === "actions") {
                const actions = getActionCustomizations();
                for (const { lastUsed, ...action } of actions.custom)
                    rows.set("custom/" + action.id, action);
                for (const [id, override] of Object.entries(actions.overrides))
                    if (!isLockedBuiltinAction(id))
                        rows.set("builtin/" + id, override);
            } else if (kind === "chats") {
                let cursor: string | null = null;
                do {
                    const page = await history().getPaginatedThreads(
                        100,
                        cursor,
                    );
                    for (const c of page.data) {
                        const { runs } = await history().getHistory(c.id);
                        runs.forEach(scopedRun);
                        rows.set(c.id, {
                            name: c.name,
                            pinned: c.starred,
                            runs: runs.map((r) => portableRun(r)),
                        });
                    }
                    cursor = page.next_cursor;
                } while (cursor);
            } else {
                if (!Zotero.AsterMargin.libraryScopeInitialized)
                    throw new Error("Library scope is unavailable");
                const known = aliases();
                tableRefs = new Map();
                for (const id of Zotero.AsterMargin.searchableLibraryIds ??
                    []) {
                    const ref = libraryRefForLibraryID(id);
                    if (!ref) continue;
                    for (const item of await Zotero.Items.getAll(id, true)) {
                        if (
                            item.deleted ||
                            !(await loadIsTableAttachment(item))
                        )
                            continue;
                        const t = await readTable({
                            libraryID: id,
                            key: item.key,
                        });
                        visitLibraryReferences(t.spec, (id) => {
                            if (id === null)
                                throw new Error(
                                    "Table source library unavailable",
                                );
                            perm(id);
                        });
                        const { key, version, ...spec } = t.spec;
                        const logical =
                            known[ref + "-" + item.key] ?? ref + "-" + item.key;
                        rows.set(logical, { library: ref, spec });
                        tableRefs.set(logical, {
                            libraryID: id,
                            key: item.key,
                            version: t.version,
                        });
                    }
                }
            }
            return rows;
        },
        async apply(id, value: any) {
            if (kind === "actions") {
                const actions = getActionCustomizations();
                if (id.startsWith("custom/")) {
                    const key = id.slice(7);
                    actions.custom = actions.custom.filter((a) => a.id !== key);
                    if (value !== null) {
                        if (value.id !== key || !isStoredAction(value))
                            throw new Error("Invalid saved action");
                        actions.custom.push(normalizeStoredAction(value));
                    }
                } else if (id.startsWith("builtin/")) {
                    const key = id.slice(8);
                    if (
                        isLockedBuiltinAction(key) ||
                        ["constructor", "__proto__", "prototype"].includes(key)
                    )
                        throw new Error("Immutable action");
                    if (value === null) delete actions.overrides[key];
                    else
                        actions.overrides[key] = normalizeStoredOverride(value);
                } else throw new Error("Unknown action ID");
                saveActionCustomizations(actions);
            } else if (kind === "chats") {
                if (value === null) {
                    await history().deleteThread(id);
                } else {
                    if (
                        !Array.isArray(value.runs) ||
                        value.runs.some(
                            (r: any) =>
                                r.thread_id !== id ||
                                typeof r.user_prompt?.content !== "string" ||
                                !Array.isArray(r.model_messages),
                        )
                    )
                        throw new Error("Invalid chat");
                    const runs = value.runs.map((r: AgentRun) =>
                        portableRun(r, true),
                    );
                    await history().replaceChat(
                        id,
                        String(value.name || "AsterMargin"),
                        !!value.pinned,
                        runs,
                    );
                }
                Zotero.AsterMargin.threads.invalidateViews();
            } else {
                const target = tableRefs.get(id);
                if (value === null) {
                    // Tables are real library items. Propagate removal from the sync set
                    // without trashing a document via an unattended network operation.
                    if (target)
                        throw new Error(
                            "Remote table removal requires review in Zotero",
                        );
                    return;
                }
                const lib = resolveLibraryRef({ library_ref: value.library });
                if (!lib) throw new Error("Table library unavailable");
                perm(lib);
                const parsed = readSpec(value.spec);
                if (!parsed.ok) throw new Error("Invalid table format");
                visitLibraryReferences(parsed.spec, (id) => {
                    if (id === null)
                        throw new Error("Table source library unavailable");
                    perm(id);
                });
                if (target) {
                    if (lib !== target.libraryID)
                        throw new Error("Table library mismatch");
                    const written = await writeTable(
                        target,
                        { ...parsed.spec, key: target.key },
                        { actor: "user", change: "WebDAV sync" },
                        target.version,
                    );
                    if (!written.ok)
                        throw new Error("Table changed during sync");
                } else {
                    const created = await createTable({
                        libraryID: lib,
                        spec: parsed.spec,
                        actor: "user",
                        operation_id: "webdav-" + id,
                        change: "WebDAV sync",
                    });
                    writeSetting(
                        "tableAliases",
                        JSON.stringify({
                            ...aliases(),
                            [value.library + "-" + created.key]: id,
                        }),
                    );
                }
            }
        },
        async checkpoint() {
            return JSON.parse(
                readSetting(checkpointKey) || "{}",
            ) as SyncCheckpoint;
        },
        async acknowledge(next) {
            writeSetting(checkpointKey, JSON.stringify(next));
        },
    };
}

export async function syncResearch(
    kind: Dataset,
    base: string,
    user: string,
    password: string,
    choices: Record<string, string> = {},
): Promise<Conflict[]> {
    const url = endpoint(base, kind);
    const auth =
        user || password
            ? "Basic " +
              btoa(
                  Array.from(
                      new TextEncoder().encode(user + ":" + password),
                      (c) => String.fromCharCode(c),
                  ).join(""),
              )
            : "";
    const identity = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(canonical([url.href, user])),
    );
    const key =
        "checkpoint." +
        Array.from(new Uint8Array(identity), (c) =>
            c.toString(16).padStart(2, "0"),
        ).join("");
    return syncDataset(url, auth, adapter(kind, key), fetch, choices);
}
