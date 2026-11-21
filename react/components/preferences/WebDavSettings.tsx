import {
    SettingsStatus,
    type SettingsStatusValue,
} from "./components/SettingsElements";
import { settingsText } from "../../utils/settingsText";
import React, { useState } from "react";
import {
    syncResearch,
    readSetting,
    writeSetting,
    type Dataset,
} from "../../runtime/webdavSync";
import type { Conflict } from "../../../src/services/webdav";

const datasets = {
    chats: "Chats",
    actions: "Saved actions",
    tables: "Research tables",
} as const satisfies Record<Dataset, string>;

export function WebDavSettings() {
    const [base, setBase] = useState(() => readSetting("base"));
    const [user, setUser] = useState(() => readSetting("username"));
    const [password, setPassword] = useState(
        () => Zotero.AsterMargin.vault?.read("webdavPassword") || "",
    );
    const [kind, setKind] = useState<Dataset>("chats");
    const [status, setStatus] = useState<SettingsStatusValue>("");
    const [busy, setBusy] = useState(false);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    async function sync(choices: Record<string, string> = {}) {
        if (busy) return;
        setBusy(true);
        setStatus("");
        try {
            writeSetting("base", base);
            writeSetting("username", user);
            await Zotero.AsterMargin.vault.write("webdavPassword", password);
            const next = await syncResearch(
                kind,
                base,
                user,
                password,
                choices,
            );
            setConflicts(next);
            setStatus(
                next.length
                    ? settingsText("Choose a revision to resolve the conflict")
                    : settingsText("Synced"),
            );
        } catch (error) {
            setStatus({
                message: settingsText("WebDAV sync failed."),
                detail: String(error),
            });
        } finally {
            setBusy(false);
        }
    }
    return (
        <fieldset disabled={busy} className="display-flex flex-col gap-2">
            <legend>{settingsText("Research sync")}</legend>
            <label>
                {settingsText("WebDAV folder URL")}{" "}
                <input
                    type="url"
                    value={base}
                    onChange={(e) => {
                        setBase(e.target.value);
                        setConflicts([]);
                    }}
                />
            </label>
            <label>
                {settingsText("Username")}{" "}
                <input
                    value={user}
                    onChange={(e) => {
                        setUser(e.target.value);
                        setConflicts([]);
                    }}
                />
            </label>
            <label>
                {settingsText("Password")}{" "}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </label>
            <select
                aria-label={settingsText("Research sync")}
                value={kind}
                onChange={(e) => {
                    setKind(e.target.value as Dataset);
                    setConflicts([]);
                }}
            >
                {Object.entries(datasets).map(([k, label]) => (
                    <option key={k} value={k}>
                        {settingsText(label)}
                    </option>
                ))}
            </select>
            <button
                type="button"
                disabled={!base.trim()}
                onClick={() => void sync()}
            >
                {settingsText("Sync")}
            </button>
            <SettingsStatus value={status} />
            {conflicts.map((c) => (
                <details key={c.id}>
                    <summary>{c.id}</summary>
                    {c.heads.map((h) => (
                        <details key={h.id}>
                            <summary>{h.id.slice(0, 12)}</summary>
                            <pre style={{ whiteSpace: "pre-wrap" }}>
                                {JSON.stringify(h.value, null, 2)}
                            </pre>
                            <button
                                type="button"
                                onClick={() => void sync({ [c.id]: h.id })}
                            >
                                {settingsText("Use revision")}
                            </button>
                        </details>
                    ))}
                </details>
            ))}
        </fieldset>
    );
}
