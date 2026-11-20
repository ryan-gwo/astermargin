import React, { useState } from "react";
import {
    syncResearch,
    readSetting,
    writeSetting,
    type Dataset,
} from "../../runtime/webdavSync";
import type { Conflict } from "../../../src/services/webdav";

const copy = {
    en: [
        "Research sync",
        "WebDAV folder URL",
        "Username",
        "Password",
        "Chats",
        "Saved actions",
        "Research tables",
        "Sync",
        "Synced",
        "Choose a revision to resolve the conflict",
        "Use revision",
    ],
    cn: [
        "研究数据同步",
        "WebDAV 文件夹地址",
        "用户名",
        "密码",
        "会话",
        "自定义动作",
        "研究表格",
        "同步",
        "同步完成",
        "选择要保留的修订版本",
        "使用此版本",
    ],
    tw: [
        "研究資料同步",
        "WebDAV 資料夾位址",
        "使用者名稱",
        "密碼",
        "對話",
        "自訂動作",
        "研究表格",
        "同步",
        "同步完成",
        "選擇要保留的修訂版本",
        "使用此版本",
    ],
};
export function WebDavSettings() {
    const language = String(Zotero.locale || "en");
    const msg =
        copy[
            /zh-(TW|HK|Hant)/i.test(language)
                ? "tw"
                : /^zh/i.test(language)
                  ? "cn"
                  : "en"
        ];
    const [base, setBase] = useState(() => readSetting("base"));
    const [user, setUser] = useState(() => readSetting("username"));
    const [password, setPassword] = useState(
        () => Zotero.AsterMargin.vault?.read("webdavPassword") || "",
    );
    const [kind, setKind] = useState<Dataset>("chats");
    const [status, setStatus] = useState("");
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
            setStatus(next.length ? msg[9] : msg[8]);
        } catch (error) {
            setStatus(String(error));
        } finally {
            setBusy(false);
        }
    }
    return (
        <fieldset disabled={busy} className="display-flex flex-col gap-2">
            <legend>{msg[0]}</legend>
            <label>
                {msg[1]}{" "}
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
                {msg[2]}{" "}
                <input
                    value={user}
                    onChange={(e) => {
                        setUser(e.target.value);
                        setConflicts([]);
                    }}
                />
            </label>
            <label>
                {msg[3]}{" "}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </label>
            <select
                aria-label={msg[0]}
                value={kind}
                onChange={(e) => {
                    setKind(e.target.value as Dataset);
                    setConflicts([]);
                }}
            >
                {(["chats", "actions", "tables"] as Dataset[]).map((k, i) => (
                    <option key={k} value={k}>
                        {msg[4 + i]}
                    </option>
                ))}
            </select>
            <button
                type="button"
                disabled={!base.trim()}
                onClick={() => void sync()}
            >
                {msg[7]}
            </button>
            <output aria-live="polite">{status}</output>
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
                                {msg[10]}
                            </button>
                        </details>
                    ))}
                </details>
            ))}
        </fieldset>
    );
}
