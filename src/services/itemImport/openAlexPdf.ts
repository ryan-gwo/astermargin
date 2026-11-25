import { effectiveMaxFileSizeMB } from "@astermargin/agent-core/transport/attachmentLimits";
import { openAlexGate } from "@astermargin/agent-local/search/openAlex";
import { getPref } from "../../utils/prefs";
import { getSystemTimers } from "../../utils/systemTimers";
import { removeDirectory, type DownloadedFile } from "../pdfAttachmentFetch";
import {
    PDF_FETCH_CANCELLED_MESSAGE,
    type PdfFetchDiagnostics,
} from "../pdfFetchDiagnostics";

const accessMethod = "openalex_content";
const contentHost = "content.openalex.org";
const lookupHost = "api.openalex.org";
const budgetMs = 45_000;

interface Work {
    id?: string;
    open_access?: { is_oa?: boolean };
    content_urls?: { pdf?: string | null };
}

function lookupIdentifier(item: Zotero.Item, workId?: string): string | null {
    const match = workId?.match(/^(?:https:\/\/openalex\.org\/)?(W\d+)$/i);
    if (match) return match[1].toUpperCase();
    const raw = item.getField("DOI") || item.getExtraField?.("DOI") || "";
    const doi = Zotero.Utilities.cleanDOI(String(raw));
    return doi
        ? `doi:${doi.split("/").map(encodeURIComponent).join("/")}`
        : null;
}

function pdfUrl(work: Work): string | null {
    if (work.open_access?.is_oa !== true) return null;
    const id = work.id?.match(/^https:\/\/openalex\.org\/(W\d+)$/)?.[1];
    if (!id) return null;
    const url = `https://${contentHost}/works/${id}.pdf`;
    return work.content_urls?.pdf === url ? url : null;
}

async function checkedGet(
    url: string,
    key: string,
    signal: AbortSignal,
): Promise<Response> {
    const response = await fetch(url, {
        signal,
        credentials: "omit",
        headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) {
        await response.body?.cancel();
        throw Object.assign(new Error("OpenAlex request failed"), {
            status: response.status,
            xmlhttp: response,
        });
    }
    return response;
}

async function savePdf(
    response: Response,
    path: string,
    signal: AbortSignal,
): Promise<void> {
    const limit = effectiveMaxFileSizeMB() * 1024 * 1024;
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty OpenAlex PDF response");
    let bytes = 0;
    try {
        if (Number(response.headers.get("Content-Length")) > limit)
            throw new Error("OpenAlex PDF exceeds size limit");
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (signal.aborted || bytes + value.length > limit)
                throw new Error(
                    "OpenAlex PDF download interrupted or exceeds size limit",
                );
            await IOUtils.write(path, value, {
                mode: bytes ? "append" : "overwrite",
            });
            bytes += value.length;
        }
        if (bytes < 10)
            throw new Error("Downloaded file was not a supported type (PDF)");
        const header = await IOUtils.read(path, { maxBytes: 5 });
        const tail = await IOUtils.read(path, {
            offset: Math.max(0, bytes - 2048),
        });
        if (
            new TextDecoder().decode(header) !== "%PDF-" ||
            !new TextDecoder().decode(tail).includes("%%EOF")
        ) {
            throw new Error("Downloaded file was not a supported type (PDF)");
        }
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}

/** Try the cached, open-access copy after the ordinary Zotero resolvers. */
export async function downloadOpenAlexPdf(
    item: Zotero.Item,
    workId: string | undefined,
    signal: AbortSignal,
    assertAccess: () => void,
    diagnostics?: PdfFetchDiagnostics,
): Promise<DownloadedFile | null> {
    const key = getPref("openAlexApiKey")?.trim();
    if (!key) return null;
    const identifier = lookupIdentifier(item, workId);
    if (!identifier) return null;

    const timers = getSystemTimers();
    const deadline = new AbortController();
    const abort = () => deadline.abort();
    const timeout = timers.setTimeout(abort, budgetMs);
    signal.addEventListener("abort", abort, { once: true });
    const assertCurrent = () => {
        if (signal.aborted) throw new Error(PDF_FETCH_CANCELLED_MESSAGE);
        assertAccess();
    };
    let host = lookupHost;
    let directory: string | undefined;
    try {
        await openAlexGate.wait(signal);
        assertCurrent();
        const metadata = await checkedGet(
            `https://${lookupHost}/works/${identifier}?select=id,open_access,content_urls`,
            key,
            deadline.signal,
        );
        const url = pdfUrl((await metadata.json()) as Work);
        if (!url) {
            diagnostics?.recordSourceAttempt(accessMethod, contentHost, {
                status: 404,
            });
            return null;
        }
        assertCurrent();
        host = contentHost;
        const response = await checkedGet(url, key, deadline.signal);
        const storage =
            await Zotero.Attachments.createTemporaryStorageDirectory();
        directory = storage.path;
        const path = PathUtils.join(directory, "file.pdf");
        await savePdf(response, path, deadline.signal);
        assertCurrent();
        diagnostics?.recordSourceAttempt(accessMethod, host);
        const saved = {
            directory,
            path,
            url,
            mimeType: "application/pdf",
            accessMethod,
        };
        directory = undefined;
        return saved;
    } catch (error) {
        assertCurrent();
        diagnostics?.recordSourceAttempt(
            accessMethod,
            host,
            deadline.signal.aborted
                ? new Error("OpenAlex PDF request timed out")
                : error,
        );
        return null;
    } finally {
        signal.removeEventListener("abort", abort);
        timers.clearTimeout(timeout);
        await removeDirectory(directory);
    }
}
