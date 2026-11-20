import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import { buildTable } from "@astermargin/agent-core/layouts/tableEdit";
import { resolveSources } from "../../src/services/artifacts/tableSources";
import { createTable } from "../../src/services/artifacts/tableStore";
import { getTablesApi } from "../../src/services/artifacts/tablesApi";
import { getContextWindow } from "./windowRuntime";
import {
    resolveObjectId,
    libraryRefForLibraryID,
} from "../../src/utils/libraryIdentity";
import { getSearchableLibraryIds } from "../../src/services/agentDataProvider/utils";

export const tableTool: NativeTool = {
    spec: {
        name: "create_research_table",
        description:
            "Create an editable Zotero research table from the chat's bibliographic item IDs and research questions.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", minLength: 1 },
                items: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 1,
                    maxItems: 500,
                },
                questions: {
                    type: "array",
                    items: { type: "string" },
                    maxItems: 20,
                },
            },
            required: ["title", "items", "questions"],
            additionalProperties: false,
        },
    },
    async run(args, signal) {
        const references = [...new Set<string>(args.items)].map((id) =>
            resolveObjectId(id),
        );
        const guard = () => {
            if (
                signal.aborted ||
                references.some(
                    (ref) =>
                        !ref ||
                        !getSearchableLibraryIds().includes(ref.library_id),
                )
            )
                throw new Error("Library access changed");
        };
        guard();
        const libraryID = references[0]!.library_id;
        const sources = await resolveSources([
            { id: "s1", type: "items", ids: args.items },
        ]);
        const columns = args.questions.map((q: string, i: number) => ({
            id: "q" + (i + 1),
            type: "text",
            header: q,
            description: q,
        }));
        const built = buildTable(
            { id: crypto.randomUUID(), title: args.title, columns },
            sources,
            new Date().toISOString().slice(0, 10),
        );
        if (!built.ok) throw new Error(built.message);
        if (
            !Zotero.getMainWindow().confirm(
                [
                    args.title,
                    args.items.length + " items",
                    ...args.questions,
                    ...args.items,
                ].join("\n"),
            )
        )
            throw new Error("Table declined");
        guard();
        const result = await createTable({
            libraryID,
            spec: built.spec,
            title: args.title,
            accessGuard: guard,
            actor: "user",
        });
        const ui = await getTablesApi()?.openTable(
            {libraryID: result.libraryID, key: result.key},
            {window: getContextWindow()},
        );
        const content = {
            table_id:
                libraryRefForLibraryID(result.libraryID) + "-" + result.key,
            title: args.title,
            opened: !!ui && !("error" in ui),
            ...(ui && "error" in ui ? {open_error: ui.error} : {}),
        };
        return { ok: true, content, text: JSON.stringify(content) };
    },
};
