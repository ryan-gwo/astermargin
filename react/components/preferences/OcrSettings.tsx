import {
    SettingsStatus,
    type SettingsStatusValue,
} from "./components/SettingsElements";
import { settingsText } from "../../utils/settingsText";
import React, { useState } from "react";
import {
    activeLanguage,
    installLanguage,
    languages,
    type OcrLanguage,
} from "../../../src/services/ocr/localLanguage";
const languageNames: Record<OcrLanguage, string> = {
    eng: "English",
    chi_sim: "简体中文",
    chi_tra: "繁體中文",
};

export function OcrSettings() {
    const [code, setCode] = useState<OcrLanguage>(activeLanguage() || "eng"),
        [status, setStatus] = useState<SettingsStatusValue>(""),
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
                picker.init(
                    Zotero.getMainWindow(),
                    settingsText("Import language file"),
                    picker.modeOpen,
                );
                picker.appendFilter("Tesseract", "*.traineddata");
                if ((await picker.show()) !== picker.returnOK) return;
                file = picker.file;
            }
            await installLanguage(code, file);
            setStatus(
                settingsText("Enabled: {language}", {
                    language: languageNames[code],
                }),
            );
        } catch (e) {
            setStatus({
                message: settingsText("Could not prepare OCR language data."),
                detail: String(e),
            });
        } finally {
            setBusy(false);
        }
    }
    const activeCode = activeLanguage();
    return (
        <fieldset disabled={busy}>
            <legend>{settingsText("Scanned PDF OCR")}</legend>
            <select
                aria-label={settingsText("Scanned PDF OCR")}
                value={code}
                onChange={(e) => setCode(e.target.value as OcrLanguage)}
            >
                {(Object.keys(languages) as OcrLanguage[]).map((k) => (
                    <option key={k} value={k}>
                        {languageNames[k]} ·{" "}
                        {(languages[k].bytes / 1048576).toFixed(2)} MiB
                    </option>
                ))}
            </select>
            <button onClick={() => void install(false)}>
                {settingsText("Download and enable")}
            </button>
            <button onClick={() => void install(true)}>
                {settingsText("Import language file")}
            </button>
            <button
                onClick={() => {
                    Zotero.Prefs.clear(
                        "extensions.zotero.astermargin.ocrLanguage",
                        true,
                    );
                    setStatus("");
                }}
            >
                {settingsText("Disable")}
            </button>
            <SettingsStatus
                value={
                    status ||
                    (activeCode
                        ? settingsText("Enabled: {language}", {
                              language: languageNames[activeCode],
                          })
                        : "")
                }
            />
        </fieldset>
    );
}
