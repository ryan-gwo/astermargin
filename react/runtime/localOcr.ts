import { createWorker, OEM } from "tesseract.js";
import { AsterMarginExtractor } from "../../src/astermargin-extract";
import {
    activeLanguage,
    modelPath,
    checkedLanguage,
} from "../../src/services/ocr/localLanguage";
import type { AttachmentReadPage } from "../../src/services/documentExtraction/attachmentReadPages";
import type { ZoteroItemReference } from "@astermargin/agent-core/types/zotero";
import { isLibrarySearchable } from "../../src/services/agentDataProvider/utils";

export async function recognizeEmptyPages(
    ref: ZoteroItemReference,
    pages: AttachmentReadPage[],
) {
    const lang = activeLanguage();
    if (!lang || !pages.length) return;
    const guard = () => {
        if (!isLibrarySearchable(ref.library_id))
            throw new Error("Library access changed");
    };
    guard();
    const candidate = await Zotero.Items.getByLibraryAndKeyAsync(
        ref.library_id,
        ref.zotero_key,
    );
    if (!candidate || candidate.deleted) return;
    const item = candidate.isAttachment()
        ? candidate
        : await candidate.getBestAttachment();
    if (!item || item.deleted || !item.isPDFAttachment()) return;
    const file = await item.getFilePathAsync();
    if (!file) return;
    const data = await IOUtils.read(file);
    const language = await checkedLanguage(
        lang,
        await IOUtils.read(modelPath(lang)),
    );
    guard();
    const prefix = "chrome://astermargin/content/lib/ocr/";
    const worker = await createWorker(
        [{ code: lang, data: language }],
        OEM.LSTM_ONLY,
        {
            workerPath: prefix + "worker-entry.js",
            corePath: prefix + "tesseract-core-lstm.wasm.js",
            workerBlobURL: false,
            cacheMethod: "none",
            gzip: false,
        },
    );
    const extractor = new AsterMarginExtractor();
    try {
        for (const page of pages) {
            guard();
            const result = await extractor.renderPages(data, {
                pageIndices: [page.pageNumber - 1],
                options: { scale: 2, maxDimension: 3200, format: "png" },
            });
            const img = result.pages[0];
            if (!img) continue;
            const { data: recognition } = await worker.recognize(
                new Blob([new Uint8Array(img.data).buffer], {
                    type: "image/png",
                }),
                {},
                { blocks: true },
            );
            guard();
            const lines = (recognition.blocks ?? []).flatMap((block) =>
                block.paragraphs.flatMap((p) => p.lines),
            );
            page.passages = lines
                .filter((line) => line.text.trim())
                .map((line, i) => ({
                    text: line.text.trim(),
                    part_id: "l" + page.pageNumber + "." + (i + 1),
                    page_locations: [
                        {
                            page_idx: img.pageIndex,
                            boxes: [
                                {
                                    l: line.bbox.x0 / img.scale,
                                    t: line.bbox.y0 / img.scale,
                                    r: line.bbox.x1 / img.scale,
                                    b: line.bbox.y1 / img.scale,
                                    coord_origin: "t",
                                },
                            ],
                        },
                    ],
                }));
        }
    } finally {
        await worker.terminate();
    }
}
