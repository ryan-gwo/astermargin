import React, { useState } from "react";
import {
    activeLanguage,
    installLanguage,
    languages,
    type OcrLanguage,
} from "../../../src/services/ocr/localLanguage";
export function OcrSettings() {
    const locale = String(Zotero.locale || "en");
    const words = /^zh-(TW|HK|Hant)/i.test(locale)
        ? ["掃描文件 OCR", "下載並啟用", "匯入語言檔", "停用", "已啟用"]
        : /^zh/i.test(locale)
          ? ["扫描文献 OCR", "下载并启用", "导入语言文件", "停用", "已启用"]
          : [
                "Scanned PDF OCR",
                "Download and enable",
                "Import language file",
                "Disable",
                "Enabled",
            ];
    const [code, setCode] = useState<OcrLanguage>(activeLanguage() || "eng"),
        [status, setStatus] = useState(""),
        [busy, setBusy] = useState(false);
    async function install(offline: boolean) {
        setBusy(true);
        setStatus("");
        try {
            let file: string | undefined;
            if (offline) {
                const { FilePicker } = ChromeUtils.importESModule(
                    "chrome://zotero/content/modules/filePicker.mjs",
                );
                const picker = new FilePicker();
                picker.init(Zotero.getMainWindow(), words[2], picker.modeOpen);
                picker.appendFilter("Tesseract", "*.traineddata");
                if ((await picker.show()) !== picker.returnOK) return;
                file = picker.file;
            }
            await installLanguage(code, file);
            setStatus(words[4] + " · " + code);
        } catch (e) {
            setStatus(String(e));
        } finally {
            setBusy(false);
        }
    }
    return (
        <fieldset disabled={busy}>
            <legend>{words[0]}</legend>
            <select
                aria-label={words[0]}
                value={code}
                onChange={(e) => setCode(e.target.value as OcrLanguage)}
            >
                {(Object.keys(languages) as OcrLanguage[]).map((k) => (
                    <option key={k} value={k}>
                        {
                            {
                                eng: "English",
                                chi_sim: "简体中文",
                                chi_tra: "繁體中文",
                            }[k]
                        }{" "}
                        · {(languages[k].bytes / 1048576).toFixed(2)} MiB
                    </option>
                ))}
            </select>
            <button onClick={() => void install(false)}>{words[1]}</button>
            <button onClick={() => void install(true)}>{words[2]}</button>
            <button
                onClick={() => {
                    Zotero.Prefs.clear(
                        "extensions.zotero.astermargin.ocrLanguage",
                        true,
                    );
                    setStatus("");
                }}
            >
                {words[3]}
            </button>
            <output aria-live="polite">{status || activeLanguage()}</output>
        </fieldset>
    );
}
