import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import Zip from "adm-zip";

const source = JSON.parse(await readFile(new URL("../addon/manifest.json", import.meta.url), "utf8"));
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
const path = process.argv[2] ?? "dist/astermargin.xpi";
const bytes = await readFile(path);
const z = new Zip(bytes);
assert(z.test(), "ZIP integrity check failed");
const manifest = JSON.parse(z.readAsText("manifest.json")),
    host = manifest.applications.zotero;
assert.equal(manifest.name, "AsterMargin");
assert.equal(host.id, pkg.config.addonID);
assert.equal(manifest.version, pkg.version);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[""].version, pkg.version);
for (const field of ["strict_min_version", "strict_max_version", "update_url"]) {
    assert.equal(host[field], source.applications.zotero[field]);
}
for (const f of [
    "bootstrap.js",
    "prefs.js",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "content/reactBundle.js",
    "content/scripts/astermargin.js",
    "content/scripts/mupdf-worker.js",
    "content/scripts/astermargin-export.js",
    "content/lib/mupdf-wasm.wasm",
    "content/lib/onnxruntime-LICENSE",
    "content/lib/ocr/worker-entry.js",
    "content/lib/ocr/worker.min.js",
    "content/lib/ocr/tesseract-core-lstm.wasm.js",
    "content/lib/e5/transformers.mjs",
    "content/lib/e5/ort-wasm.wasm",
    "content/lib/e5/ort-wasm-simd.wasm",
]) {
    assert(z.getEntry(f)?.header.size, "Missing resource " + f);
}
for (const size of [48, 96]) {
    const png = z.readFile(manifest.icons[String(size)]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
}
const names = z.getEntries().map((e) => e.entryName);
for (const lang of ["en-US", "zh-CN", "zh-TW"])
    assert(
        names.some(
            (n) =>
                n.startsWith("locale/" + lang + "/") &&
                n.endsWith("mainWindow.ftl"),
        ),
    );
assert(
    !names.some((n) =>
        /\.DS_Store$|\.traineddata$|\.onnx$|(?:^|\/)\.env/.test(n),
    ),
    "Unexpected package content",
);
assert(
    !z.readAsText("bootstrap.js").includes("__addon"),
    "Unsubstituted manifest token",
);
console.log(
    JSON.stringify(
        {
            file: path,
            version: manifest.version,
            bytes: bytes.length,
            entries: names.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
        },
        null,
        2,
    ),
);
