import React, { useEffect, useRef, useState } from "react";
import {
    buildSemanticIndex,
    e5Enabled,
    installEmbeddingModel,
    modelSize,
} from "../../runtime/semanticIndex";
export function SemanticSettings() {
    const lang = String(Zotero.locale);
    const labels = /^zh-(TW|HK|Hant)/i.test(lang)
        ? [
              "全文語意檢索",
              "下載模型",
              "從資料夾匯入",
              "建立或更新索引",
              "停止",
              "已建立索引",
              "失敗",
          ]
        : /^zh/i.test(lang)
          ? [
                "全文语义检索",
                "下载模型",
                "从文件夹导入",
                "建立或更新索引",
                "停止",
                "已建立索引",
                "失败",
            ]
          : [
                "Full-text semantic search",
                "Download model",
                "Import from folder",
                "Build or refresh index",
                "Stop",
                "Indexed",
                "Failed",
            ];
    const [status, setStatus] = useState(""),
        [busy, setBusy] = useState(false);
    const ctl = useRef<AbortController | null>(null);
    useEffect(() => () => ctl.current?.abort(), []);
    async function work(mode: "download" | "offline" | "index") {
        setBusy(true);
        setStatus("");
        try {
            if (mode === "index") {
                ctl.current = new AbortController();
                const r = await buildSemanticIndex(
                    (i, n) => setStatus(i + "/" + n),
                    ctl.current.signal,
                );
                setStatus(
                    labels[5] +
                        " " +
                        r.indexed +
                        " · " +
                        labels[6] +
                        " " +
                        r.failed,
                );
            } else {
                let dir: string | undefined;
                if (mode === "offline") {
                    const { FilePicker } = ChromeUtils.importESModule(
                        "chrome://zotero/content/modules/filePicker.mjs",
                    );
                    const p = new FilePicker();
                    p.init(Zotero.getMainWindow(), labels[2], p.modeGetFolder);
                    if ((await p.show()) !== p.returnOK) return;
                    dir = p.file;
                }
                await installEmbeddingModel(dir);
                setStatus("✓ multilingual-e5-small");
            }
        } catch (err) {
            setStatus(String(err));
        } finally {
            ctl.current = null;
            setBusy(false);
        }
    }
    return (
        <fieldset>
            <legend>{labels[0]}</legend>
            <p>
                multilingual-e5-small · {(modelSize / 1048576).toFixed(1)} MiB
            </p>
            <button disabled={busy} onClick={() => void work("download")}>
                {labels[1]}
            </button>
            <button disabled={busy} onClick={() => void work("offline")}>
                {labels[2]}
            </button>
            <button
                disabled={busy || !e5Enabled()}
                onClick={() => void work("index")}
            >
                {labels[3]}
            </button>
            {busy && (
                <button onClick={() => ctl.current?.abort()}>
                    {labels[4]}
                </button>
            )}
            <output aria-live="polite">{status}</output>
        </fieldset>
    );
}
