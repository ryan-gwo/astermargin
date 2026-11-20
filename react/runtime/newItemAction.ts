import { getMergedActions } from "../types/actionStorage";
import { getPref } from "../../src/utils/prefs";
import { getSearchableLibraryIds } from "../../src/services/agentDataProvider/utils";
import { clientForFormat } from "@astermargin/agent-local/llm/clientForFormat";
import { resolveLocalAgentConfig } from "@astermargin/agent-local/config/localAgentConfig";
import { handleCreateNote } from "../../src/services/localEndpoints/mcp";
import { modelObjectId } from "../../src/utils/libraryIdentity";

export const triggerPref = "extensions.zotero.astermargin.newItemAction";
export const triggerId = () =>
    String(Zotero.Prefs.get(triggerPref, true) || "");
export async function onNewPapers(ids: number[]) {
    const actionId = triggerId();
    const action = getMergedActions().find(
        (a) => a.id === actionId && a.targets.includes("items"),
    );
    if (!action) return;
    const cfg = resolveLocalAgentConfig({
        model:
            JSON.parse(getPref("lastUsedModel") || "null")?.custom_model ??
            null,
        maxRounds: 1,
    });
    if (!cfg.ok) throw new Error(cfg.message);
    const model = cfg.config.model;
    for (const id of ids) {
        const item = await Zotero.Items.getAsync(id);
        if (
            !item ||
            !item.isRegularItem() ||
            item.deleted ||
            !getSearchableLibraryIds().includes(item.libraryID)
        )
            continue;
        const lib = Zotero.Libraries.get(item.libraryID);
        if (!lib || !lib.editable) continue;
        const ref = modelObjectId(item.libraryID, item.key);
        const key = "auto-" + actionId + "-" + ref;
        if (!(await Zotero.AsterMargin.db.localHistory.beginTrigger(key)))
            continue;
        try {
            if (
                triggerId() !== actionId ||
                !getSearchableLibraryIds().includes(item.libraryID)
            )
                throw new Error("Rule or library access changed");
            const ctl = new AbortController(),
                timer = setTimeout(() => ctl.abort(), 120000);
            let result;
            try {
                result = await clientForFormat(
                    model.format ?? "openai",
                ).streamTurn(
                    {
                        model,
                        tools: [],
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Write a reading note from the supplied bibliographic record and abstract only. Preserve uncertainty.",
                            },
                            {
                                role: "user",
                                content: JSON.stringify({
                                    task: action.text,
                                    title: item.getField("title"),
                                    abstract: item.getField("abstractNote"),
                                }),
                            },
                        ],
                    },
                    { onTextDelta() {}, onThinkingDelta() {} },
                    ctl.signal,
                );
            } finally {
                clearTimeout(timer);
            }
            if (
                triggerId() !== actionId ||
                !getSearchableLibraryIds().includes(item.libraryID)
            )
                throw new Error("Rule or library access changed");
            const note = await handleCreateNote({
                title: action.title,
                content: result.text,
                parent_id: ref,
            });
            if (note.isError) throw new Error(note.content[0]?.text);
            await Zotero.AsterMargin.db.localHistory.endTrigger(
                key,
                JSON.stringify({ note: note.note_id, usage: result.usage }),
            );
        } catch (error) {
            await Zotero.AsterMargin.db.localHistory.endTrigger(
                key,
                JSON.stringify({ error: String(error) }),
            );
            Zotero.logError(error as Error);
        }
    }
}
