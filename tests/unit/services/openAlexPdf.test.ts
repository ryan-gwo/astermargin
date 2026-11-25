import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { downloadOpenAlexPdf } from "../../../src/services/itemImport/openAlexPdf";
import { createPdfFetchDiagnostics } from "../../../src/services/pdfFetchDiagnostics";

const { preference } = vi.hoisted(() => ({ preference: vi.fn() }));
vi.mock("../../../src/utils/prefs", () => ({ getPref: preference }));
vi.mock("@astermargin/agent-core/transport/attachmentLimits", () => ({
    effectiveMaxFileSizeMB: () => 1,
}));
vi.mock("@astermargin/agent-local/search/openAlex", () => ({
    openAlexGate: { wait: async () => {} },
}));

const item = { getField: () => "10.1000/example" } as unknown as Zotero.Item;
const url = "https://content.openalex.org/works/W123.pdf";
const fetchResponse = vi.fn();
const io = {
    read: vi.fn(),
    write: vi.fn(),
    remove: vi.fn(),
};
const createStorage = vi.fn();

beforeEach(() => {
    vi.resetAllMocks();
    preference.mockReturnValue("test-key");
    createStorage.mockResolvedValue({ path: "/fixture/storage" });
    vi.stubGlobal("fetch", fetchResponse);
    vi.stubGlobal("IOUtils", io);
    vi.stubGlobal("PathUtils", {
        join: (...parts: string[]) => parts.join("/"),
    });
    vi.stubGlobal("Zotero", {
        Utilities: { cleanDOI: (value: string) => value },
        Attachments: { createTemporaryStorageDirectory: createStorage },
    });
});
afterEach(() => vi.unstubAllGlobals());

it("uses the work's cached open-access file and keeps the key out of the attachment URL", async () => {
    fetchResponse
        .mockResolvedValueOnce(
            Response.json({
                id: "https://openalex.org/W123",
                open_access: { is_oa: true },
                content_urls: { pdf: url },
            }),
        )
        .mockResolvedValueOnce(new Response("%PDF-1.7\n%%EOF"));
    io.read
        .mockResolvedValueOnce(new TextEncoder().encode("%PDF-"))
        .mockResolvedValueOnce(new TextEncoder().encode("%%EOF"));
    const diagnostics = createPdfFetchDiagnostics();
    const file = await downloadOpenAlexPdf(
        item,
        undefined,
        new AbortController().signal,
        vi.fn(),
        diagnostics,
    );
    expect(file).toMatchObject({
        path: "/fixture/storage/file.pdf",
        url,
        accessMethod: "openalex_content",
    });
    expect(fetchResponse).toHaveBeenNthCalledWith(
        1,
        "https://api.openalex.org/works/doi:10.1000/example?select=id,open_access,content_urls",
        expect.objectContaining({
            headers: { Authorization: "Bearer test-key" },
        }),
    );
    expect(fetchResponse).toHaveBeenNthCalledWith(
        2,
        url,
        expect.objectContaining({
            headers: { Authorization: "Bearer test-key" },
        }),
    );
    expect(diagnostics.attempts()).toEqual([
        {
            accessMethod: "openalex_content",
            host: "content.openalex.org",
            outcome: "ok",
        },
    ]);
    expect(io.remove).not.toHaveBeenCalled();
});

it("declines an untrusted content URL instead of sending the credential to it", async () => {
    fetchResponse.mockResolvedValueOnce(
        Response.json({
            id: "https://openalex.org/W123",
            open_access: { is_oa: true },
            content_urls: { pdf: "https://example.com/paper.pdf" },
        }),
    );
    await expect(
        downloadOpenAlexPdf(
            item,
            undefined,
            new AbortController().signal,
            vi.fn(),
        ),
    ).resolves.toBeNull();
    expect(fetchResponse).toHaveBeenCalledOnce();
    expect(createStorage).not.toHaveBeenCalled();
});

it("cleans up a downloaded file that is not a PDF and records why", async () => {
    fetchResponse
        .mockResolvedValueOnce(
            Response.json({
                id: "https://openalex.org/W123",
                open_access: { is_oa: true },
                content_urls: { pdf: url },
            }),
        )
        .mockResolvedValueOnce(new Response("<html>Access denied</html>"));
    io.read.mockResolvedValue(new TextEncoder().encode("<html"));
    const diagnostics = createPdfFetchDiagnostics();
    await expect(
        downloadOpenAlexPdf(
            item,
            "W123",
            new AbortController().signal,
            vi.fn(),
            diagnostics,
        ),
    ).resolves.toBeNull();
    expect(diagnostics.attempts()).toMatchObject([
        { accessMethod: "openalex_content", outcome: "not_pdf" },
    ]);
    expect(io.remove).toHaveBeenCalledWith("/fixture/storage", {
        recursive: true,
        ignoreAbsent: true,
    });
});
