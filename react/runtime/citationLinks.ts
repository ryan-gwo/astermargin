import type { NativeTool } from "@astermargin/agent-local/tools/toolCatalog";
import { getPref } from "../../src/utils/prefs";

export const citationLinks: NativeTool = {
    spec: {
        name: "trace_citation_links",
        description:
            "Trace references or citing papers of an OpenAlex work (W identifier or DOI).",
        parameters: {
            type: "object",
            properties: {
                work: { type: "string" },
                direction: { type: "string", enum: ["references", "citing"] },
                page: { type: "integer", minimum: 1, maximum: 100 },
            },
            required: ["work", "direction"],
            additionalProperties: false,
        },
    },
    async run(args, signal) {
        const input = String(args.work)
            .trim()
            .replace(/^https?:\/\/(?:doi.org|openalex.org)\//i, "");
        if (!/^W\d+$/i.test(input) && !/^10\.\d{4,9}\/\S+$/i.test(input))
            throw new Error("Expected an OpenAlex W ID or DOI");
        const key = String(getPref("openAlexApiKey") || "");
        async function get(path: string, params: Record<string, string> = {}) {
            const url = new URL("https://api.openalex.org/works" + path);
            for (const [k, v] of Object.entries(params))
                url.searchParams.set(k, v);
            if (key) url.searchParams.set("api_key", key);
            const res = await fetch(url.href, { signal, credentials: "omit" });
            if (!res.ok) throw new Error("OpenAlex HTTP " + res.status);
            return (await res.json()) as any;
        }
        const work = await get(
            "/" +
                (/^W/i.test(input)
                    ? input
                    : "https://doi.org/" +
                      input.split("/").map(encodeURIComponent).join("/")),
            { select: "id,referenced_works,cited_by_count" },
        );
        const page = Number(args.page || 1),
            perPage = 25;
        let result: any;
        if (args.direction === "citing") {
            result = await get("", {
                filter: "cites:" + work.id.split("/").pop(),
                page: String(page),
                per_page: String(perPage),
                select: "id,doi,display_name,publication_year",
            });
        } else {
            const ids = work.referenced_works
                .slice((page - 1) * perPage, page * perPage)
                .map((id: string) => id.split("/").pop());
            result = ids.length
                ? await get("", {
                      filter: "openalex:" + ids.join("|"),
                      per_page: String(perPage),
                      select: "id,doi,display_name,publication_year",
                  })
                : { results: [] };
        }
        const data = {
            work: work.id,
            direction: args.direction,
            page,
            total:
                args.direction === "citing"
                    ? work.cited_by_count
                    : work.referenced_works.length,
            works: result.results,
        };
        return { ok: true, content: data, text: JSON.stringify(data) };
    },
};
