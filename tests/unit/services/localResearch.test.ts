import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { LocalHistory } from "../../../src/services/threads/localHistory";
import {
    syncDataset,
    canonical,
    endpoint,
    type SyncAdapter,
    type SyncCheckpoint,
} from "../../../src/services/webdav";
import { localFillCell } from "../../../src/services/tableFills/localFill";
import { LocalCitations } from "../../../packages/agent-local/src/run/localCitations";

function dbHistory() {
    const db = new Database(":memory:");
    db.pragma("foreign_keys=on");
    return new LocalHistory(
        async (sql, args = []) => {
            const stmt = db.prepare(sql);
            if (stmt.reader) return stmt.all(...args);
            stmt.run(...args);
            return [];
        },
        async (work) => {
            db.exec("BEGIN");
            try {
                await work();
                db.exec("COMMIT");
            } catch (e) {
                db.exec("ROLLBACK");
                throw e;
            }
        },
    );
}
const run = (id: string, chat: string, text: string) =>
    ({
        id,
        thread_id: chat,
        created_at: id,
        user_prompt: { content: text, attachments: [] },
        model_messages: [],
        status: "completed",
        user_id: "local",
    }) as any;
describe("Local research data", () => {
    it("preserves and reopens runs, pinned titles and evidence through reinitialization and retries", async () => {
        const db = dbHistory();
        await db.initialize();
        await db.save(run("01", "a", "中文"));
        await db.save(run("02", "a", "more"));
        await db.renameThread("a", "双星");
        await db.starThread("a");
        await db.initialize();
        expect((await db.searchThreads("双星")).data[0].starred).toBe(true);
        expect((await db.getHistory("a")).runs.map((r) => r.id)).toEqual([
            "01",
            "02",
        ]);
        expect((await db.truncateThread("a", ["01"], null)).reason).toBe(
            "not_a_suffix",
        );
        expect(
            (await db.truncateThread("a", ["02"], "01")).deleted_run_ids,
        ).toEqual(["02"]);
        await db.replaceChat("a", "synced", false, [run("01", "a", "中文")]);
        expect((await db.getHistory("a")).runs).toHaveLength(1);
    });
    it("ranks full text only in allowed libraries and replaces superseded passages", async () => {
        const h = dbHistory();
        await h.initialize();
        await h.replaceEmbeddings("u-AAA", 1, "a", [
            { text: "binary stars", page: 12, vector: [1, 0] },
        ]);
        await h.replaceEmbeddings("g2-BBB", 2, "a", [
            { text: "excluded", page: 4, vector: [1, 0] },
        ]);
        await h.replaceEmbeddings("u-AAA", 1, "b", [
            { text: "masses", page: 13, vector: [0, 1] },
        ]);
        expect(await h.nearest([0, 1], [1])).toEqual([
            { id: "u-AAA", library: 1, page: 13, text: "masses", score: 1 },
        ]);
    });
    it("rejects invented table evidence and preserves exact page locations for verified quotes", () => {
        const column = {
                id: "a",
                header: "Mass",
                type: "text",
                question_hash: "q",
            },
            source = new Map([
                [
                    "s1",
                    {
                        id: "s1",
                        text: "Mass was 2 M.",
                        page: 3,
                        boxes: [[0, 1, 2, 3]],
                    },
                ],
            ]);
        expect(
            localFillCell(
                column,
                { value: "9", quote: "9 M", locator: "s1" },
                "u-AAA",
                source,
            ).outcome,
        ).toBe("failed");
        expect(
            localFillCell(
                column,
                { value: "2 M", quote: "2 M", locator: "s1" },
                "u-AAA",
                source,
            ),
        ).toMatchObject({
            value: { text: "2 M" },
            evidence: [{ quote: "2 M", page: 3 }],
        });
    });
    it("resolves observed sentence labels only", () => {
        const citations = new LocalCitations();
        citations.record({
            attachment_id: "1-ABCD1234",
            content_kind: "pdf",
            evidence: [
                {
                    id: "s4",
                    page: 9,
                    text: "A measured mass.",
                    location: {
                        part_id: "s4",
                        page_idx: 8,
                        boxes: [[1, 2, 3, 4]],
                    },
                },
            ],
        });
        const found = citations.find(
            '<citation id="1-ABCD1234" loc="s5"/><citation id="1-ABCD1234" loc="s4"/>',
            "r",
        );
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({
            preview: "A measured mass.",
            pages: [9],
            locations: [{ page_idx: 8 }],
        });
    });
});
function device(init?: string) {
    const values = new Map<string, unknown>();
    if (init) values.set("note", init);
    let checkpoint: SyncCheckpoint = {};
    const adapter: SyncAdapter = {
        read: async () => new Map(values),
        apply: async (id, v) => {
            if (v === null) values.delete(id);
            else values.set(id, v);
        },
        checkpoint: async () => checkpoint,
        acknowledge: async (next) => {
            checkpoint = next;
        },
    };
    return { values, adapter };
}
it("merges two WebDAV devices, preserves concurrent revisions, resolves by choice and propagates deletion", async () => {
    let body = "",
        etag = 0;
    const request: any = async (_: string, init: any) => {
        if (init.method === "MKCOL") return new Response("", { status: 405 });
        if (init.method === "PUT") {
            const ok = body
                ? init.headers["If-Match"] === '"' + etag + '"'
                : init.headers["If-None-Match"] === "*";
            if (!ok) return new Response("", { status: 412 });
            body = init.body;
            etag++;
            return new Response("", { status: 201 });
        }
        return body
            ? new Response(body, { headers: { etag: '"' + etag + '"' } })
            : new Response("", { status: 404 });
    };
    const url = endpoint("https://dav.example/folder", "actions"),
        a = device("original"),
        b = device();
    for (const d of [a, b]) await syncDataset(url, "", d.adapter, request);
    expect(b.values.get("note")).toBe("original");
    a.values.set("note", "alpha");
    b.values.set("note", "beta");
    await syncDataset(url, "", a.adapter, request);
    const [conflict] = await syncDataset(url, "", b.adapter, request);
    expect(conflict.heads.map((r) => r.value).sort()).toEqual([
        "alpha",
        "beta",
    ]);
    const pick = conflict.heads.find((r) => r.value === "beta")!;
    await syncDataset(url, "", b.adapter, request, { note: pick.id });
    await syncDataset(url, "", a.adapter, request);
    expect(a.values.get("note")).toBe("beta");
    a.values.delete("note");
    await syncDataset(url, "", a.adapter, request);
    await syncDataset(url, "", b.adapter, request);
    expect(b.values.size).toBe(0);
    expect(canonical({ x: 1, y: true })).toBe(canonical({ y: true, x: 1 }));
});
