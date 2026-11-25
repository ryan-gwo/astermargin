import {
    SettingsStatus,
    type SettingsStatusValue,
} from "./components/SettingsElements";
import { settingsText } from "../../utils/settingsText";
import React, { useEffect, useRef, useState } from "react";
import {
    buildSemanticIndex,
    e5Enabled,
    installEmbeddingModel,
    modelSize,
} from "../../runtime/semanticIndex";
import { semanticModelCandidates } from "../../../src/services/semanticCandidates";
export function SemanticSettings() {
    const [status, setStatus] = useState<SettingsStatusValue>(""),
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
                    settingsText("Indexed: {indexed} · Failed: {failed}", {
                        indexed: r.indexed,
                        failed: r.failed,
                    }),
                );
            } else {
                let dir: string | undefined;
                if (mode === "offline") {
                    const { FilePicker } = ChromeUtils.importESModule(
                        "chrome://zotero/content/modules/filePicker.mjs",
                    );
                    const p = new FilePicker();
                    p.init(
                        Zotero.getMainWindow(),
                        settingsText("Import from folder"),
                        p.modeGetFolder,
                    );
                    if ((await p.show()) !== p.returnOK) return;
                    dir = p.file;
                }
                await installEmbeddingModel(dir);
                setStatus(
                    settingsText("Embedding model installed: {model}", {
                        model: "multilingual-e5-small",
                    }),
                );
            }
        } catch (err) {
            setStatus({
                message: settingsText("Semantic search operation failed."),
                detail: String(err),
            });
        } finally {
            ctl.current = null;
            setBusy(false);
        }
    }
    return (
        <fieldset>
            <legend>{settingsText("Full-text semantic search")}</legend>
            <p>
                multilingual-e5-small · {(modelSize / 1048576).toFixed(1)} MiB
            </p>
            <p className="text-sm font-color-secondary">
                {settingsText("Evaluation candidates: {models}. Compare top-five retrieval, cross-language queries, latency and memory before changing the local default.", {
                    models: semanticModelCandidates.map((candidate) => candidate.label).join(", "),
                })}
            </p>
            <button disabled={busy} onClick={() => void work("download")}>
                {settingsText("Download model")}
            </button>
            <button disabled={busy} onClick={() => void work("offline")}>
                {settingsText("Import from folder")}
            </button>
            <button
                disabled={busy || !e5Enabled()}
                onClick={() => void work("index")}
            >
                {settingsText("Build or refresh index")}
            </button>
            {busy && (
                <button onClick={() => ctl.current?.abort()}>
                    {settingsText("Stop")}
                </button>
            )}
            <SettingsStatus value={status} />
        </fieldset>
    );
}
