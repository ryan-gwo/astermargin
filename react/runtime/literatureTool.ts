import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import { searchLiterature } from "../../src/services/literatureIndex";

/** Reader-chat tool for physics indexes. Writes remain in the standalone
 * preview flow so a model can only propose an import. */
export const literatureTool: NativeTool = {
    spec: {
        name: "search_physics_literature",
        description: "Search arXiv and NASA ADS for physics or astronomy literature. This tool is read-only and returns metadata and links for the user to review.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", minLength: 1 },
                providers: { type: "array", items: { type: "string", enum: ["arxiv", "ads"] } },
                limit: { type: "integer", minimum: 1, maximum: 20 },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    async run(args, signal) {
        if (signal.aborted) throw new Error("Search canceled");
        const providers: ("arxiv" | "ads")[] = Array.isArray(args.providers)
            ? args.providers.filter((value: unknown): value is "arxiv" | "ads" => value === "arxiv" || value === "ads")
            : ["arxiv", "ads"];
        const records = await searchLiterature(String(args.query), { providers, limit: Number(args.limit) || 10 });
        if (signal.aborted) throw new Error("Search canceled");
        const results = records.map((record) => ({
            provider: record.provider,
            id: record.id,
            title: record.title,
            authors: record.authors,
            year: record.year ?? null,
            venue: record.venue ?? null,
            doi: record.doi ?? null,
            arxiv_id: record.arxivId ?? null,
            bibcode: record.bibcode ?? null,
            url: record.url,
            pdf_url: record.pdfUrl ?? null,
            abstract: record.abstract ?? null,
        }));
        return { ok: true, content: { results }, text: JSON.stringify(results) };
    },
};
