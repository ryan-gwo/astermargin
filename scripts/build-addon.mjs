import { Build, Config } from "zotero-plugin-scaffold";
import { copyFile, mkdir } from "node:fs/promises";

// Call the public builder directly so packaging also works offline.
process.env.NODE_ENV = "production";
const config = await Config.loadConfig({});
config.hooks.hook("build:copyAssets", async () => {
    const modelRuntime = config.dist + "/addon/content/lib/e5/";
    await mkdir(modelRuntime, { recursive: true });
    for (const [from, to] of [
        ["dist/transformers.min.js", "transformers.mjs"],
        ["LICENSE", "Transformers.LICENSE"],
        ["dist/ort-wasm-simd.wasm", "ort-wasm-simd.wasm"],
        ["dist/ort-wasm.wasm", "ort-wasm.wasm"],
    ]) {
        await copyFile(
            "node_modules/@xenova/transformers/" + from,
            modelRuntime + to,
        );
    }
    const target = config.dist + "/addon/content/lib/ocr/";
    await mkdir(target, { recursive: true });
    for (const [source, name] of [
        ["tesseract.js/dist/worker.min.js", "worker.min.js"],
        ["tesseract.js/dist/worker.min.js.LICENSE.txt", "worker.LICENSE.txt"],
        ["tesseract.js/LICENSE.md", "Tesseract-js.LICENSE"],
        ["tesseract.js-core/LICENSE", "Tesseract-core.LICENSE"],
        [
            "tesseract.js-core/tesseract-core-lstm.wasm.js",
            "tesseract-core-lstm.wasm.js",
        ],
    ])
        await copyFile("node_modules/" + source, target + name);
    for (const name of ["LICENSE", "THIRD_PARTY_NOTICES.md"])
        await copyFile(name, config.dist + "/addon/" + name);
});
await new Build(config).run();
await mkdir("dist", { recursive: true });
await copyFile(`${config.dist}/${config.xpiName}.xpi`, "dist/astermargin.xpi");
