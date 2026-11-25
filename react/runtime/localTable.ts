import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import {
    MAX_ROWS,
    MAX_MODEL_COLUMNS,
    type SourceEntry,
} from "@astermargin/agent-core/layouts/table";
import { buildTable } from "@astermargin/agent-core/layouts/tableEdit";
import { resolveSources } from "../../src/services/artifacts/tableSources";
import { createTable } from "../../src/services/artifacts/tableStore";
import { tableFilesEditable } from "../../src/services/artifacts/tableItemIdentity";
import { getTablesApi } from "../../src/services/artifacts/tablesApi";
import { getContextWindow } from "./windowRuntime";
import {
    resolveObjectId,
    resolveLibraryRef,
    libraryRefForLibraryID,
} from "../../src/utils/libraryIdentity";
import { getSearchableLibraryIds } from "../../src/services/agentDataProvider/utils";
import { uiText } from "../utils/interfaceText";

export const tableTool: NativeTool = {
    spec: {
        name: "create_research_table",
        description:
            "Create an editable Zotero research table from item IDs, collections, tags, or saved searches. Use portable library refs such as u or g123. Include at least one item or source.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", minLength: 1 },
                items: {
                    type: "array",
                    items: { type: "string" },
                    maxItems: MAX_ROWS,
                },
                sources: {
                    type: "array",
                    maxItems: 20,
                    items: {
                        type: "object",
                        properties: {
                            kind: {
                                type: "string",
                                enum: ["collection", "tag", "saved_search"],
                            },
                            library_ref: { type: "string" },
                            key_or_tag: {
                                type: "string",
                                description:
                                    "Collection key, saved-search key, or tag name",
                            },
                        },
                        required: ["kind", "library_ref", "key_or_tag"],
                        additionalProperties: false,
                    },
                },
                questions: {
                    type: "array",
                    items: { type: "string" },
                    maxItems: MAX_MODEL_COLUMNS,
                },
            },
            required: ["title", "questions"],
            additionalProperties: false,
        },
    },
    async run(args, signal) {
        const itemIds = [...new Set<string>(args.items ?? [])];
        const sources: SourceEntry[] = [];
        const libraryIds = itemIds.map((id) => resolveObjectId(id)?.library_id);

        if (itemIds.length)
            sources.push({ id: "items", type: "items", ids: itemIds });
        for (const source of args.sources ?? []) {
            const { kind, library_ref, key_or_tag } = source;
            if (
                !key_or_tag.trim() ||
                (kind !== "tag" && !/^[A-Z0-9]{8}$/.test(key_or_tag))
            ) {
                throw new Error("Invalid table source key or tag");
            }
            libraryIds.push(resolveLibraryRef({ library_ref }) ?? undefined);
            sources.push({
                id: `source-${sources.length + 1}`,
                type: "library",
                scope:
                    kind === "tag"
                        ? { kind, library_ref, tag: key_or_tag }
                        : { kind, library_ref, key: key_or_tag },
            });
        }

        const libraryID = libraryIds[0];
        if (libraryID === undefined || !sources.length)
            throw new Error("A table requires at least one available source");
        const guard = () => {
            const allowed = getSearchableLibraryIds();
            if (
                signal.aborted ||
                libraryIds.some(
                    (id) => id === undefined || !allowed.includes(id),
                )
            ) {
                throw new Error("Library access changed");
            }
            const library = Zotero.Libraries.get(libraryID);
            if (!library || !tableFilesEditable(library))
                throw new Error("This library is read-only.");
        };
        guard();

        const resolved = await resolveSources(sources);
        const unavailable = resolved.find((source) => source.error);
        if (unavailable) throw new Error(unavailable.error);
        const columns = args.questions.map(
            (question: string, index: number) => ({
                id: `q${index + 1}`,
                type: "text",
                header: question,
                description: question,
            }),
        );
        const built = buildTable(
            { id: crypto.randomUUID(), title: args.title, columns },
            resolved,
            new Date().toISOString().slice(0, 10),
        );
        if (!built.ok) throw new Error(built.message);
        guard();

        const window = getContextWindow();
        const approval = Zotero.Prompt.confirm({
            window,
            title: uiText("Create AsterMargin Table"),
            text: [
                args.title,
                uiText("{count} papers in the research table", {
                    count: built.spec.rows.length,
                }),
                ...resolved.flatMap(({ entry }) =>
                    entry.scope
                        ? [
                              entry.scope.name ??
                                  entry.scope.tag ??
                                  entry.scope.key,
                          ]
                        : [],
                ),
                ...args.questions,
            ].join("\n"),
            button0: uiText("Create AsterMargin Table"),
            button1: uiText("Cancel"),
            defaultButton: 1,
        });
        if (approval !== 0) throw new Error("Table declined");
        guard();

        const result = await createTable({
            libraryID,
            spec: built.spec,
            title: args.title,
            accessGuard: guard,
            actor: "user",
        });
        const ui = await getTablesApi()?.openTable(
            { libraryID: result.libraryID, key: result.key },
            { window },
        );
        const content = {
            table_id:
                libraryRefForLibraryID(result.libraryID) + "-" + result.key,
            title: args.title,
            opened: !!ui && !("error" in ui),
            ...(ui && "error" in ui ? { open_error: ui.error } : {}),
        };
        return { ok: true, content, text: JSON.stringify(content) };
    },
};
