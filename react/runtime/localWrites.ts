import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import type { AgentAction } from "@astermargin/agent-core/agents/agentActionTypes";
import { handleAgentActionValidateRequest } from "../../src/services/agentDataProvider/handleAgentActionValidateRequest";
import { handleAgentActionExecuteRequest } from "../../src/services/agentDataProvider/handleAgentActionExecuteRequest";
import { captureInstanceOperation } from "../../src/services/localEndpoints/operation";
import { getSearchableLibraryIds } from "../../src/services/agentDataProvider/utils";

const operations = {
    create_note: [
        "undoCreateNoteAction",
        "title, content (Markdown), optional parent_item_id or library and collection",
    ],
    edit_note: [
        "undoEditNoteAction",
        "library_ref, zotero_key, operation, old_string, new_string",
    ],
    edit_note_batch: [
        "undoEditNoteBatchAction",
        "library_ref, zotero_key, edits",
    ],
    create_collection: [
        "undoCreateCollectionAction",
        "name, library_ref, optional parent_key and item_ids",
    ],
    organize_items: [
        "undoOrganizeItemsAction",
        "item_ids plus tags or collections",
    ],
    manage_tags: [
        "undoManageTagsAction",
        "action, name, library_ref, optional new_name",
    ],
    manage_collections: [
        "undoManageCollectionsAction",
        "action, library_ref, collection_key and changes",
    ],
    edit_metadata: [
        "undoEditMetadataAction",
        "library_ref, zotero_key and edits",
    ],
    create_item: [
        "undoCreateItemAction",
        "item_type, library and bibliographic fields",
    ],
    import_item: [
        "undoImportItemAction",
        "external reference identifiers to import",
    ],
    merge_items: [
        "undoMergeItemsAction",
        "master and duplicate bibliographic items and chosen fields",
    ],
    create_highlight_annotations: [
        "undoCreateAnnotationsAction",
        "attachment and grounded passage locations, selected text and annotation type",
    ],
    create_note_annotations: [
        "undoCreateAnnotationsAction",
        "attachment and grounded note positions",
    ],
    edit_annotations: [
        "undoEditAnnotationsAction",
        "target annotation references and edits",
    ],
} as const;
type Kind = keyof typeof operations;
const failure = (error: string, retryable = false) => ({
    ok: false as const,
    error,
    retryable,
});
const success = (content: Record<string, unknown>) => ({
    ok: true as const,
    content,
    text: JSON.stringify(content),
});

export function localWriteTools(runId: string): NativeTool[] {
    const changes = (
        Object.entries(operations) as [Kind, readonly [string, string]][]
    ).map(
        ([kind, [, description]]): NativeTool => ({
            spec: {
                name: kind,
                description:
                    "Preview and apply a Zotero change. Fields: " + description,
                parameters: {
                    type: "object",
                    properties: { data: { type: "object", description } },
                    required: ["data"],
                    additionalProperties: false,
                },
            },
            async run(args, signal) {
                if (signal.aborted || !getSearchableLibraryIds().length)
                    return failure("Library unavailable");
                const request_id = crypto.randomUUID();
                const op = {
                    ...captureInstanceOperation(),
                    runId,
                    userId: "local",
                };
                const input = {
                    request_id,
                    action_type: kind,
                    action_data: args.data,
                    operation: op,
                };
                const valid = await handleAgentActionValidateRequest({
                    ...input,
                    event: "agent_action_validate",
                });
                if (!valid.valid)
                    return failure(valid.error || "Invalid proposal", true);
                if (valid.preference === "continue_without_applying")
                    return failure("The user disabled this operation");
                const data = { ...args.data, ...valid.normalized_action_data };
                const scope = JSON.stringify(getSearchableLibraryIds().sort());
                if (
                    signal.aborted ||
                    !Zotero.getMainWindow().confirm(
                        "AsterMargin · " +
                            kind +
                            "\n\n" +
                            JSON.stringify(data, null, 2),
                    )
                )
                    return failure("Change declined");
                const guard = () => {
                    if (
                        signal.aborted ||
                        scope !==
                            JSON.stringify(getSearchableLibraryIds().sort())
                    )
                        throw new Error("Library access changed");
                };
                guard();
                const done = await handleAgentActionExecuteRequest(
                    {
                        ...input,
                        action_data: data,
                        event: "agent_action_execute",
                        action_id: request_id,
                        run_id: runId,
                    },
                    {
                        signal,
                        receivedAt: Date.now(),
                        reportPhase() {},
                        assertCurrent: guard,
                    },
                );
                if (!done.success)
                    return failure(done.error || "Change failed");
                const action: AgentAction = {
                    id: request_id,
                    run_id: runId,
                    user_id: "local",
                    action_type: kind,
                    status: "applied",
                    proposed_data: data,
                    result_data: done.result_data,
                };
                await Zotero.AsterMargin.db.localHistory.recordAction(
                    action,
                    scope,
                );
                return success({
                    action_id: request_id,
                    action_type: kind,
                    result: done.result_data,
                });
            },
        }),
    );
    return [
        ...changes,
        {
            spec: {
                name: "undo_local_change",
                description:
                    "Undo an applied change using its returned action_id.",
                parameters: {
                    type: "object",
                    properties: { action_id: { type: "string" } },
                    required: ["action_id"],
                    additionalProperties: false,
                },
            },
            async run(args, signal) {
                const history = Zotero.AsterMargin.db.localHistory;
                const record = await history.getAction(args.action_id);
                if (!record || record.action.status !== "applied")
                    return failure("No applied action with this ID");
                if (
                    !JSON.parse(record.scope).every((id: number) =>
                        getSearchableLibraryIds().includes(id),
                    )
                )
                    return failure("Library unavailable");
                const kind = record.action.action_type as Kind;
                if (!Object.hasOwn(operations, kind))
                    return failure("Unknown operation");
                if (
                    signal.aborted ||
                    !Zotero.getMainWindow().confirm(
                        "AsterMargin · Undo " +
                            kind +
                            "\n\n" +
                            JSON.stringify(
                                record.action.proposed_data,
                                null,
                                2,
                            ),
                    )
                )
                    return failure("Undo declined");
                const result = await Zotero.AsterMargin.libraryOperations.run(
                    operations[kind][0],
                    [record.action],
                );
                if (
                    result &&
                    typeof result === "object" &&
                    "needsConfirmation" in result &&
                    result.needsConfirmation
                )
                    return failure(
                        "The item has since been edited. Review the change in Zotero.",
                    );
                await history.recordAction(
                    { ...record.action, status: "undone" },
                    record.scope,
                );
                return success({ action_id: args.action_id, status: "undone" });
            },
        },
    ];
}
