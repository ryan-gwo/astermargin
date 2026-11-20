import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import type { CustomChatModel } from "@astermargin/agent-core/types/customChatModel";
import { clientForFormat } from "@astermargin/agent-local/llm/clientForFormat";
import { getSearchableLibraryIds } from "../../src/services/agentDataProvider/utils";
import {
    resolveObjectId,
    modelObjectId,
} from "../../src/utils/libraryIdentity";
import { handleReadAttachmentRequest } from "../../src/services/agentDataProvider/handleReadAttachmentRequest";
import { recognizeEmptyPages } from "./localOcr";
import { handleCreateNote } from "../../src/services/localEndpoints/mcp";

const limits = { tag: 1000, extract: 180, note: 100 };
type Mode = keyof typeof limits;
const ok = (content: Record<string, unknown>) => ({
    ok: true as const,
    content,
    text: JSON.stringify(content),
});
const db = () => Zotero.AsterMargin.db.localHistory;
async function target(raw: string) {
    const ref = resolveObjectId(raw);
    if (!ref || !getSearchableLibraryIds().includes(ref.library_id))
        throw new Error("Library unavailable");
    const item = await Zotero.Items.getByLibraryAndKeyAsync(
        ref.library_id,
        ref.zotero_key,
    );
    if (!item || item.deleted || item.parentItem?.deleted)
        throw new Error("Item unavailable");
    return item;
}
function writable(id: number) {
    const lib = Zotero.Libraries.get(id);
    return !!lib && lib.editable;
}
function assertScope(scope: number[], signal: AbortSignal) {
    if (
        signal.aborted ||
        !scope.every((id) => getSearchableLibraryIds().includes(id))
    )
        throw new Error("Stopped or library access changed");
}
export function localBatchTools(model: CustomChatModel): NativeTool[] {
    const lookup: NativeTool = {
        spec: {
            name: "batch_status",
            description:
                "Read counts and up to 25 per-item results of a local batch. Offset is zero-based.",
            parameters: {
                type: "object",
                properties: {
                    job_id: { type: "string" },
                    offset: { type: "integer", minimum: 0 },
                },
                required: ["job_id"],
                additionalProperties: false,
            },
        },
        async run(args, signal) {
            const job = await db().job(args.job_id);
            assertScope(job.scope, signal);
            const counts: Record<string, number> = {};
            for (const row of job.rows)
                counts[row.status] = (counts[row.status] || 0) + 1;
            const start = args.offset ?? 0;
            return ok({
                job_id: args.job_id,
                counts,
                rows: job.rows
                    .slice(start, start + 25)
                    .map((r) => ({ ...r, receipt: JSON.parse(r.receipt) })),
            });
        },
    };
    const execute = async (id: string, signal: AbortSignal, retry = false) => {
        const job = await db().job(id);
        assertScope(job.scope, signal);
        for (const row of job.rows) {
            if (signal.aborted) break;
            if (!(await db().claimRow(id, row.idx, retry))) continue;
            let writing = false;
            try {
                assertScope(job.scope, signal);
                const item = await target(row.ref);
                if (job.kind === "tag") {
                    if (!writable(item.libraryID))
                        throw new Error("Read-only library");
                    const existed = item.hasTag(job.question);
                    if (!existed) {
                        assertScope(job.scope, signal);
                        writing = true;
                        item.addTag(job.question);
                        await item.saveTx();
                    }
                    await db().finishRow(id, row.idx, "done", {
                        tag: job.question,
                        added: !existed,
                    });
                    continue;
                }
                const file = item.isAttachment()
                    ? item
                    : await item.getBestAttachment();
                let material = String(item.getField("abstractNote") || "");
                const cap = Math.min(
                    100000,
                    Math.max(2000, (model.context_window ?? 16000) - 1800) * 2,
                );
                if (file) {
                    material = "";
                    let page = 1,
                        total = 1;
                    do {
                        assertScope(job.scope, signal);
                        const result = await handleReadAttachmentRequest(
                            {
                                event: "read_attachment_request",
                                request_id: crypto.randomUUID(),
                                attachment_id: modelObjectId(
                                    file.libraryID,
                                    file.key,
                                ),
                                start_page: page,
                                end_page: page,
                                located: true,
                                max_chars: cap + 1,
                            },
                            recognizeEmptyPages,
                        );
                        if (result.error) throw new Error(result.error);
                        material +=
                            "\n[p." +
                            page +
                            "] " +
                            (result.pages?.[0]?.text || "");
                        total = result.total_pages ?? 1;
                        page++;
                        if (
                            material.length > cap ||
                            result.pages?.some((p) => p.truncated)
                        )
                            throw new Error(
                                "Document exceeds the model context window",
                            );
                    } while (page <= total);
                }
                if (!material.trim()) throw new Error("No readable material");
                assertScope(job.scope, signal);
                const answer = await clientForFormat(
                    model.format ?? "openai",
                ).streamTurn(
                    {
                        model,
                        tools: [],
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Answer the research question using only the supplied document. Include page or passage labels for evidence. If absent, say so.",
                            },
                            {
                                role: "user",
                                content: JSON.stringify({
                                    question: job.question,
                                    document: material,
                                }),
                            },
                        ],
                    },
                    { onTextDelta() {}, onThinkingDelta() {} },
                    signal,
                );
                assertScope(job.scope, signal);
                let note: string | null = null;
                if (job.kind === "note") {
                    writing = true;
                    const out = await handleCreateNote({
                        title: job.question,
                        content: answer.text,
                        parent_id: row.ref,
                    });
                    if (out.isError)
                        throw new Error(
                            out.content?.[0]?.text || "Could not create note",
                        );
                    note = out.note_id;
                }
                await db().finishRow(id, row.idx, "done", {
                    answer: answer.text,
                    note,
                    usage: answer.usage,
                });
            } catch (err) {
                await db().finishRow(
                    id,
                    row.idx,
                    writing ? "review" : "failed",
                    { error: String(err) },
                );
            }
        }
        return lookup.run({ job_id: id }, signal);
    };
    const spec: NativeTool["spec"]["parameters"] = {
        type: "object",
        properties: {
            mode: { type: "string", enum: ["tag", "extract", "note"] },
            items: { type: "array", items: { type: "string" }, maxItems: 1000 },
            question: { type: "string", minLength: 1 },
        },
        required: ["mode", "items", "question"],
        additionalProperties: false,
    };
    return [
        lookup,
        {
            spec: {
                name: "run_batch",
                description:
                    "Apply one tag, extract a finding, or create one reading note per selected item. Supply portable item IDs. Preview before starting.",
                parameters: spec,
            },
            async run(args, signal) {
                const kind = args.mode as Mode,
                    refs = [...new Set<string>(args.items)];
                if (!refs.length || refs.length > limits[kind])
                    throw new Error("Batch size exceeds the limit");
                const scope = new Set<number>();
                for (const ref of refs) {
                    const item = await target(ref);
                    scope.add(item.libraryID);
                    if (kind !== "extract" && !writable(item.libraryID))
                        throw new Error("Read-only library");
                }
                const id = crypto.randomUUID();
                if (
                    signal.aborted ||
                    !Zotero.getMainWindow().confirm(
                        [
                            "AsterMargin",
                            kind + " × " + refs.length,
                            args.question,
                            "Model calls (estimated): " +
                                (kind === "tag" ? 0 : refs.length),
                            "Job: " + id,
                            ...refs,
                        ].join("\n"),
                    )
                )
                    throw new Error("Batch declined");
                await db().createJob(id, kind, args.question, [...scope], refs);
                return execute(id, signal);
            },
        },
        {
            spec: {
                name: "resume_batch",
                description:
                    "Resume pending rows and retry failed reads from a local job. Uncertain writes are held for review.",
                parameters: {
                    type: "object",
                    properties: { job_id: { type: "string" } },
                    required: ["job_id"],
                    additionalProperties: false,
                },
            },
            run: (args, signal) => execute(args.job_id, signal, true),
        },
    ];
}
