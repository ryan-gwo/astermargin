import { LocalCitations } from "@astermargin/agent-local/run/localCitations";
import type { AgentRun } from "@astermargin/agent-core/agents/types";
import type { AgentAction } from "@astermargin/agent-core/agents/agentActionTypes";
import type { ThreadRunsResponse } from "@astermargin/agent-core/transport/agentService";
import type {
    ThreadItemLibraryRef,
    ThreadModel,
    ThreadRunMatch,
    ThreadTruncationReport,
} from "@astermargin/agent-core/transport/threadService";

type Query = (sql: string, args?: readonly unknown[]) => Promise<any[]>;
type Transaction = (work: () => Promise<void>) => Promise<void>;
const localUser = "local";
const wire = (r: any): ThreadModel => ({
    id: r.id,
    name: r.name,
    user_id: localUser,
    created_at: r.created_at,
    updated_at: r.updated_at,
    starred: !!r.pinned,
});

export class LocalHistory {
    constructor(
        private query: Query,
        private transaction: Transaction,
    ) {}

    async initialize() {
        await this.query(
            "CREATE TABLE IF NOT EXISTS automatic_notes(id TEXT PRIMARY KEY,receipt TEXT)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_batch_jobs(id TEXT PRIMARY KEY,kind TEXT NOT NULL,question TEXT NOT NULL,scope TEXT NOT NULL)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_batch_rows(job TEXT REFERENCES local_batch_jobs(id) ON DELETE CASCADE,idx INTEGER,ref TEXT,status TEXT,receipt TEXT,PRIMARY KEY(job,idx))",
        );
        // A stopped write may already have reached Zotero. Never replay it automatically.
        await this.query(
            "UPDATE local_batch_rows SET status='review' WHERE status='running'",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS embedding_docs(id TEXT PRIMARY KEY, library INTEGER NOT NULL, stamp TEXT NOT NULL)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_passages(doc TEXT REFERENCES embedding_docs(id) ON DELETE CASCADE,page INTEGER,text TEXT,vector TEXT)",
        );
        await this.query(
            "CREATE INDEX IF NOT EXISTS passages_doc ON local_passages(doc)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_chats (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_runs (id TEXT PRIMARY KEY, chat_id TEXT NOT NULL REFERENCES local_chats(id) ON DELETE CASCADE, created_at TEXT NOT NULL, payload TEXT NOT NULL)",
        );
        await this.query(
            "CREATE INDEX IF NOT EXISTS local_runs_by_chat ON local_runs(chat_id,created_at)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_actions(id TEXT PRIMARY KEY, scope TEXT NOT NULL, action TEXT NOT NULL)",
        );
        await this.query(
            "CREATE TABLE IF NOT EXISTS local_run_sources (run_id TEXT NOT NULL REFERENCES local_runs(id) ON DELETE CASCADE, library TEXT NOT NULL, item TEXT NOT NULL, kind TEXT NOT NULL, PRIMARY KEY(run_id,library,item,kind))",
        );
    }

    async beginTrigger(id: string) {
        let created = false;
        await this.transaction(async () => {
            if (
                (
                    await this.query(
                        "SELECT 1 FROM automatic_notes WHERE id=?",
                        [id],
                    )
                ).length
            )
                return;
            await this.query("INSERT INTO automatic_notes(id) VALUES(?)", [id]);
            created = true;
        });
        return created;
    }
    async endTrigger(id: string, receipt: string) {
        await this.query("UPDATE automatic_notes SET receipt=? WHERE id=?", [
            receipt,
            id,
        ]);
    }
    async createJob(
        id: string,
        kind: string,
        question: string,
        scope: number[],
        refs: string[],
    ) {
        await this.transaction(async () => {
            await this.query("INSERT INTO local_batch_jobs VALUES(?,?,?,?)", [
                id,
                kind,
                question,
                JSON.stringify(scope),
            ]);
            for (const [idx, ref] of refs.entries())
                await this.query(
                    "INSERT INTO local_batch_rows VALUES(?,?,?,'pending','{}')",
                    [id, idx, ref],
                );
        });
    }
    async job(id: string) {
        const [job] = await this.query(
            "SELECT * FROM local_batch_jobs WHERE id=?",
            [id],
        );
        if (!job) throw new Error("Unknown batch job");
        return {
            kind: String(job.kind),
            question: String(job.question),
            scope: JSON.parse(job.scope) as number[],
            rows: (await this.query(
                "SELECT idx,ref,status,receipt FROM local_batch_rows WHERE job=? ORDER BY idx",
                [id],
            )).map(row => ({idx: row.idx, ref: row.ref, status: row.status, receipt: row.receipt})),
        };
    }
    async claimRow(id: string, idx: number, retry: boolean) {
        let claimed = false;
        await this.transaction(async () => {
            const [row] = await this.query(
                "SELECT status FROM local_batch_rows WHERE job=? AND idx=?",
                [id, idx],
            );
            if (
                row?.status !== "pending" &&
                !(retry && row?.status === "failed")
            )
                return;
            await this.query(
                "UPDATE local_batch_rows SET status='running' WHERE job=? AND idx=?",
                [id, idx],
            );
            claimed = true;
        });
        return claimed;
    }
    async finishRow(id: string, idx: number, status: string, receipt: unknown) {
        await this.query(
            "UPDATE local_batch_rows SET status=?,receipt=? WHERE job=? AND idx=? AND status='running'",
            [status, JSON.stringify(receipt), id, idx],
        );
    }
    async embeddingStamp(id: string) {
        return (
            await this.query("SELECT stamp FROM embedding_docs WHERE id=?", [
                id,
            ])
        )[0]?.stamp;
    }
    async replaceEmbeddings(
        id: string,
        library: number,
        stamp: string,
        rows: { page: number; text: string; vector: number[] }[],
    ) {
        await this.transaction(async () => {
            await this.query("DELETE FROM embedding_docs WHERE id=?", [id]);
            await this.query("INSERT INTO embedding_docs VALUES(?,?,?)", [
                id,
                library,
                stamp,
            ]);
            for (const row of rows)
                await this.query("INSERT INTO local_passages VALUES(?,?,?,?)", [
                    id,
                    row.page,
                    row.text,
                    JSON.stringify(row.vector),
                ]);
        });
    }
    async nearest(
        vector: number[],
        libraries: number[],
        limit = 12,
        allowed?: Set<string>,
        groupByDocument = false,
    ) {
        const best: {
            id: string;
            library: number;
            page: number;
            text: string;
            score: number;
        }[] = [];
        if (!libraries.length) return best;
        let cursor = 0;
        while (true) {
            const rows = await this.query(
                `SELECT p.rowid AS n,d.id,d.library,p.page,p.text,p.vector FROM local_passages p JOIN embedding_docs d ON d.id=p.doc WHERE d.library IN (${libraries.map(() => "?").join(",")}) AND p.rowid>? ORDER BY p.rowid LIMIT 128`,
                [...libraries, cursor],
            );
            for (const r of rows) {
                cursor = r.n;
                if (allowed && !allowed.has(r.id)) continue;
                const v: number[] = JSON.parse(r.vector);
                const score = v.reduce((sum, x, i) => sum + x * vector[i], 0);
                if (groupByDocument) {
                    const index = best.findIndex((b) => b.id === r.id);
                    if (index >= 0) {
                        if (best[index].score >= score) continue;
                        best.splice(index, 1);
                    }
                }
                best.push({
                    id: r.id,
                    library: r.library,
                    page: r.page,
                    text: r.text,
                    score,
                });
            }
            best.sort((a, b) => b.score - a.score);
            best.splice(limit);
            if (rows.length < 128) return best;
        }
    }
    async recordAction(action: AgentAction, scope: string) {
        await this.query(
            "INSERT INTO local_actions VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET action=excluded.action",
            [action.id, scope, JSON.stringify(action)],
        );
    }
    async getAction(
        id: string,
    ): Promise<{ action: AgentAction; scope: string } | null> {
        const [record] = await this.query(
            "SELECT action,scope FROM local_actions WHERE id=?",
            [id],
        );
        return record
            ? { action: JSON.parse(record.action), scope: record.scope }
            : null;
    }
    save(run: AgentRun) {
        return this.transaction(() => this.writeRun(run));
    }
    private async writeRun(run: AgentRun) {
        if (!run.thread_id) return;
        const thread = run.thread_id;
        const when = run.completed_at ?? run.created_at;
        const title =
            run.user_prompt.content.trim().replace(/\s+/g, " ").slice(0, 100) ||
            "AsterMargin";
        {
            await this.query(
                "INSERT INTO local_chats(id,name,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=max(updated_at,excluded.updated_at)",
                [thread, title, run.created_at, when],
            );
            await this.query(
                "INSERT INTO local_runs(id,chat_id,created_at,payload) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE chat_id=excluded.chat_id",
                [
                    run.id,
                    thread,
                    run.created_at,
                    JSON.stringify(run, (k, v) =>
                        /^(api_key|access_token|refresh_token|authorization)$/i.test(
                            k,
                        )
                            ? undefined
                            : v,
                    ),
                ],
            );
            await this.query("DELETE FROM local_run_sources WHERE run_id=?", [
                run.id,
            ]);
            const storeRef = async (
                ref: {
                    library_ref?: string | null;
                    library_id?: number;
                    zotero_key: string;
                },
                kind: string,
            ) => {
                for (const identity of new Set(
                    [
                        ref.library_ref,
                        ref.library_id && String(ref.library_id),
                    ].filter(Boolean),
                )) {
                    await this.query(
                        "INSERT OR IGNORE INTO local_run_sources VALUES(?,?,?,?)",
                        [run.id, identity, ref.zotero_key, kind],
                    );
                }
            };
            for (const ref of run.user_prompt.attachments ?? [])
                if ("zotero_key" in ref) await storeRef(ref, "user_attachment");
            for (const c of run.metadata?.citations ?? [])
                for (const ref of [c.parent_ref, c.resolved_ref]) {
                    if (ref?.kind === "zotero") await storeRef(ref, "citation");
                }
        }
    }

    async replaceChat(
        id: string,
        name: string,
        pinned: boolean,
        runs: AgentRun[],
    ) {
        if (!runs.length || runs.some((r) => r.thread_id !== id))
            throw new Error("Invalid chat history");
        await this.transaction(async () => {
            await this.query("DELETE FROM local_chats WHERE id=?", [id]);
            for (const run of runs) await this.writeRun(run);
            await this.query(
                "UPDATE local_chats SET name=?,pinned=? WHERE id=?",
                [name, pinned ? 1 : 0, id],
            );
        });
    }
    async getHistory(id: string): Promise<ThreadRunsResponse> {
        const rows = await this.query(
            "SELECT payload FROM local_runs WHERE chat_id=? ORDER BY created_at,rowid",
            [id],
        );
        const runs: AgentRun[] = rows.map((r) => {
            const run: AgentRun = JSON.parse(r.payload);
            if (!run.metadata?.citations?.length) {
                const verified = new LocalCitations();
                for (const message of run.model_messages) for (const part of message.parts) {
                    if (part.part_kind === "tool-return" && part.tool_name === "read_attachment"
                        && typeof part.content === "object" && part.content && !Array.isArray(part.content)) {
                        verified.record(part.content as Record<string, unknown>);
                    }
                }
                const answer = run.model_messages.flatMap(m => m.kind === "response"
                    ? m.parts.flatMap(p => p.part_kind === "text" ? [p.content] : []) : []).join("\n");
                const citations = verified.find(answer, run.id);
                if (citations.length) run.metadata = { ...run.metadata, citations };
            }
            return run;
        });
        return {
            runs,
            tail_run_id: runs.at(-1)?.id ?? null,
            activity: { state: "idle", run_id: null },
            agent_actions: [],
        };
    }
    async getThread(id: string, _options?: unknown) {
        const [row] = await this.query("SELECT * FROM local_chats WHERE id=?", [
            id,
        ]);
        if (!row) throw new Error("Chat not found");
        return wire(row);
    }
    async searchThreads(
        q: string,
        limit = 15,
        after: string | null = null,
        _scope?: unknown,
    ) {
        const offset = Math.max(0, Number(after) || 0);
        const rows = await this.query(
            "SELECT * FROM local_chats WHERE instr(lower(name),lower(?))>0 ORDER BY updated_at DESC,id LIMIT ? OFFSET ?",
            [q, limit + 1, offset],
        );
        const hasMore = rows.length > limit;
        return {
            data: rows.slice(0, limit).map(wire),
            has_more: hasMore,
            next_cursor: hasMore ? String(offset + limit) : null,
            other_instance_count: 0,
        };
    }
    getPaginatedThreads(
        limit = 15,
        after: string | null = null,
        _scope?: unknown,
        _count?: boolean,
    ) {
        return this.searchThreads("", limit, after);
    }
    async getStarredThreads(limit: number, _scope?: unknown) {
        return (
            await this.query(
                "SELECT * FROM local_chats WHERE pinned=1 ORDER BY updated_at DESC,id LIMIT ?",
                [limit],
            )
        ).map(wire);
    }
    async renameThread(id: string, name: string) {
        await this.query(
            "UPDATE local_chats SET name=?,updated_at=? WHERE id=?",
            [name, new Date().toISOString(), id],
        );
        return this.getThread(id);
    }
    async deleteThread(id: string) {
        await this.query("DELETE FROM local_chats WHERE id=?", [id]);
    }
    private async pin(id: string, value: number) {
        await this.query("UPDATE local_chats SET pinned=? WHERE id=?", [
            value,
            id,
        ]);
        return this.getThread(id);
    }
    starThread(id: string) {
        return this.pin(id, 1);
    }
    unstarThread(id: string) {
        return this.pin(id, 0);
    }
    async findThreadsByItem(
        library: ThreadItemLibraryRef,
        keys: string[],
        mode: string = "attachments",
    ): Promise<ThreadRunMatch[]> {
        if (!keys.length) return [];
        const args = [library.libraryRef ?? String(library.libraryId), ...keys];
        const predicate = mode === "both" ? "" : " AND s.kind=?";
        if (predicate)
            args.push(mode === "citations" ? "citation" : "user_attachment");
        const rows = await this.query(
            `SELECT c.*,r.id AS run_id,s.kind FROM local_run_sources s JOIN local_runs r ON r.id=s.run_id JOIN local_chats c ON c.id=r.chat_id WHERE s.library=? AND s.item IN (${keys.map(() => "?").join(",")})${predicate} ORDER BY c.updated_at DESC`,
            args,
        );
        return rows.map((r) => ({
            ...wire(r),
            run_id: r.run_id,
            match_type: r.kind,
        }));
    }
    async truncateThread(
        id: string,
        ids: string[],
        tail: string | null,
    ): Promise<ThreadTruncationReport> {
        const wanted = new Set(ids);
        const result: ThreadTruncationReport = {
            deleted_run_ids: [],
            refused_run_ids: [],
            reason: null,
        };
        await this.transaction(async () => {
            const rows = await this.query(
                "SELECT id FROM local_runs WHERE chat_id=? ORDER BY created_at,rowid",
                [id],
            );
            const first = rows.findIndex((r) => wanted.has(r.id));
            const kept = first < 0 ? rows : rows.slice(0, first);
            const removed = first < 0 ? [] : rows.slice(first);
            if (removed.some((r) => !wanted.has(r.id)))
                result.reason = "not_a_suffix";
            else if ((kept.at(-1)?.id ?? null) !== tail)
                result.reason = "tail_mismatch";
            if (result.reason) {
                result.refused_run_ids = ids;
                return;
            }
            for (const r of removed) {
                await this.query(
                    "DELETE FROM local_runs WHERE chat_id=? AND id=?",
                    [id, r.id],
                );
                result.deleted_run_ids.push(r.id);
            }
        });
        return result;
    }
}
