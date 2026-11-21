import { actionDisplayText } from "../../utils/actionDisplayText";
import { settingsText } from "../../utils/settingsText";
import React, { useState } from "react";
import { getMergedActions } from "../../types/actionStorage";
import { triggerId, triggerPref } from "../../runtime/newItemAction";
export function ReadingRule() {
    const [id, setId] = useState(triggerId);
    return (
        <fieldset>
            <legend>{settingsText("Automatic reading notes")}</legend>
            <p>
                {settingsText(
                    "When a paper is added, send its title and abstract to the selected model and save the chosen action’s result as a child note.",
                )}
            </p>
            <select
                aria-label={settingsText("Automatic reading notes")}
                value={id}
                onChange={(e) => {
                    Zotero.Prefs.set(triggerPref, e.target.value, true);
                    setId(e.target.value);
                }}
            >
                <option value="">{settingsText("Off")}</option>
                {getMergedActions()
                    .filter((a) => a.targets.includes("items"))
                    .map((a) => (
                        <option key={a.id} value={a.id}>
                            {actionDisplayText(a, "title")}
                        </option>
                    ))}
            </select>
        </fieldset>
    );
}
