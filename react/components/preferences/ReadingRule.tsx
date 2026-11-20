import React, { useState } from "react";
import { getMergedActions } from "../../types/actionStorage";
import { triggerId, triggerPref } from "../../runtime/newItemAction";
export function ReadingRule() {
    const [id, setId] = useState(triggerId);
    const l = String(Zotero.locale),
        labels = /^zh-(TW|HK|Hant)/i.test(l)
            ? [
                  "新文獻自動筆記",
                  "關閉",
                  "新增文獻時，將題名、摘要交給所選模型，執行此動作並建立子筆記。",
              ]
            : /^zh/i.test(l)
              ? [
                    "新文献自动笔记",
                    "关闭",
                    "新增文献时，将标题、摘要交给所选模型，执行此动作并创建子笔记。",
                ]
              : [
                    "Automatic reading notes",
                    "Off",
                    "When a paper is added, send its title and abstract to the selected model and save the chosen action’s result as a child note.",
                ];
    return (
        <fieldset>
            <legend>{labels[0]}</legend>
            <p>{labels[2]}</p>
            <select
                aria-label={labels[0]}
                value={id}
                onChange={(e) => {
                    Zotero.Prefs.set(triggerPref, e.target.value, true);
                    setId(e.target.value);
                }}
            >
                <option value="">{labels[1]}</option>
                {getMergedActions()
                    .filter((a) => a.targets.includes("items"))
                    .map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.title}
                        </option>
                    ))}
            </select>
        </fieldset>
    );
}
