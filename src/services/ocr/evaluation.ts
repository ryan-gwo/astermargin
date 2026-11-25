import { getPref } from "../../utils/prefs";

export interface SelectedOcrPage {
    page: number;
    imageBase64: string;
}

export interface OcrEvaluationResult {
    engine: "local-tesseract" | "cloud";
    pages: number[];
    elapsedMs: number;
    textChars: number;
    lineCount: number;
    requestPages: number[];
}

/** Manual page selection is an explicit privacy boundary for cloud OCR. */
export function parseSelectedPages(value: string, maxPages = 20): number[] {
    const pages = value.split(/[\s,;]+/u).flatMap((part) => {
        if (!part) return [];
        const range = /^(\d+)-(\d+)$/.exec(part);
        if (range) {
            const start = Number(range[1]);
            const end = Number(range[2]);
            if (start > end) return [];
            return Array.from({ length: end - start + 1 }, (_, index) => start + index);
        }
        return /^\d+$/.test(part) ? [Number(part)] : [];
    }).filter((page) => page > 0);
    return [...new Set(pages)].sort((a, b) => a - b).slice(0, maxPages);
}

export function cloudOcrConfig(): { endpoint: string; apiKey: string } {
    return {
        endpoint: String(getPref("cloudOcrEndpoint") || "https://api.mistral.ai/v1/ocr"),
        apiKey: String(getPref("cloudOcrApiKey") || ""),
    };
}

/** Send only the selected page images to a user-configured OCR endpoint. */
export async function runCloudOcrEvaluation(pages: SelectedOcrPage[], signal?: AbortSignal): Promise<OcrEvaluationResult> {
    if (!pages.length) throw new Error("Select at least one page.");
    const config = cloudOcrConfig();
    if (!config.apiKey.trim()) throw new Error("Add a cloud OCR API key first.");
    const started = Date.now();
    const response = await fetch(config.endpoint, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ pages: pages.map((page) => ({ page: page.page, image: page.imageBase64 })) }),
    });
    if (!response.ok) throw new Error(`Cloud OCR request failed (${response.status})`);
    const data = await response.json() as { pages?: Array<{ page?: number; text?: string }> };
    const text = (data.pages ?? []).map((page) => page.text ?? "").join("\n");
    return {
        engine: "cloud",
        pages: pages.map((page) => page.page),
        requestPages: pages.map((page) => page.page),
        elapsedMs: Date.now() - started,
        textChars: text.length,
        lineCount: text.split(/\r?\n/u).filter(Boolean).length,
    };
}
