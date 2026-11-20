import languages from "./languages.json";
export { languages };
export type OcrLanguage = keyof typeof languages;
const root = () =>
    PathUtils.join(Zotero.DataDirectory.dir, "astermargin", "ocr");
export const modelPath = (code: OcrLanguage) =>
    PathUtils.join(root(), code + ".traineddata");
export async function checkedLanguage(code: OcrLanguage, bytes: Uint8Array) {
    const info = languages[code];
    if (!info || bytes.length !== info.bytes)
        throw new Error("Incorrect OCR model size");
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new Uint8Array(bytes).buffer,
    );
    if (
        Array.from(new Uint8Array(hash), (n) =>
            n.toString(16).padStart(2, "0"),
        ).join("") !== info.sha256
    )
        throw new Error("OCR model checksum mismatch");
    return bytes;
}
export async function installLanguage(code: OcrLanguage, file?: string) {
    const url =
        "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/87416418657359cb625c412a48b6e1d6d41c29bd/" +
        code +
        ".traineddata";
    let bytes: Uint8Array;
    if (file) bytes = await IOUtils.read(file);
    else {
        const got = await fetch(url, { credentials: "omit" });
        if (!got.ok) throw new Error("OCR download: " + got.status);
        bytes = new Uint8Array(await got.arrayBuffer());
    }
    await checkedLanguage(code, bytes);
    await IOUtils.makeDirectory(root(), { createAncestors: true });
    await IOUtils.write(modelPath(code), bytes, {
        tmpPath: modelPath(code) + "." + crypto.randomUUID() + ".tmp",
    });
    Zotero.Prefs.set("extensions.zotero.astermargin.ocrLanguage", code, true);
}
export function activeLanguage(): OcrLanguage | null {
    const val = Zotero.Prefs.get(
        "extensions.zotero.astermargin.ocrLanguage",
        true,
    );
    return typeof val === "string" && Object.hasOwn(languages, val)
        ? (val as OcrLanguage)
        : null;
}
