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
import { parseSelectedPages } from "../../../src/services/ocr/evaluation";
import { getPref, setPref } from "../../../src/utils/prefs";
const languageNames: Record<OcrLanguage, string> = {
    eng: "English",
    chi_sim: "简体中文",
    chi_tra: "繁體中文",
};

export function OcrSettings() {
    const [code, setCode] = useState<OcrLanguage>(activeLanguage() || "eng"),
        [status, setStatus] = useState<SettingsStatusValue>(""),
        [busy, setBusy] = useState(false),
        [selectedPages, setSelectedPages] = useState(() => String(getPref("cloudOcrPages") || "3,7")),
        [cloudEndpoint, setCloudEndpoint] = useState(() => String(getPref("cloudOcrEndpoint") || "https://api.mistral.ai/v1/ocr")),
        [cloudKey, setCloudKey] = useState(() => String(getPref("cloudOcrApiKey") || ""));
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
            <div className="border-top-quinary mt-2 pt-2">
                <div className="font-color-primary text-base font-medium">{settingsText("Cloud OCR evaluation")}</div>
                <div className="text-sm font-color-secondary mb-1">
                    {settingsText("Only pages you select are rendered and sent. This comparison does not change the local OCR engine.")}
                </div>
                <label className="display-flex flex-col gap-05 text-sm font-color-secondary">
                    {settingsText("Selected pages")}
                    <input value={selectedPages} onChange={(event) => setSelectedPages(event.target.value)} placeholder="3,7" />
                </label>
                <label className="display-flex flex-col gap-05 text-sm font-color-secondary mt-1">
                    {settingsText("Cloud OCR endpoint")}
                    <input value={cloudEndpoint} onChange={(event) => setCloudEndpoint(event.target.value)} />
                </label>
                <label className="display-flex flex-col gap-05 text-sm font-color-secondary mt-1">
                    {settingsText("Cloud OCR API key")}
                    <input type="password" value={cloudKey} onChange={(event) => setCloudKey(event.target.value)} />
                </label>
                <button
                    onClick={() => {
                        const pages = parseSelectedPages(selectedPages);
                        setPref("cloudOcrPages", pages.join(","));
                        setPref("cloudOcrEndpoint", cloudEndpoint.trim());
                        setPref("cloudOcrApiKey", cloudKey);
                        setStatus(settingsText("Saved selected pages: {pages}", { pages: pages.join(", ") || settingsText("none") }));
                    }}
                >
                    {settingsText("Save evaluation settings")}
                </button>
            </div>
        </fieldset>
    );
}
