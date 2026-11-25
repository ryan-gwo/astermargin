import { getPref } from "../utils/prefs";
import type { ZoteroItemJson } from "@astermargin/agent-core/types/itemImport";

export type LiteratureProvider = "arxiv" | "ads";

export interface LiteratureRecord {
    provider: LiteratureProvider;
    id: string;
    title: string;
    authors: string[];
    abstract?: string;
    year?: string;
    venue?: string;
    doi?: string;
    arxivId?: string;
    bibcode?: string;
    url: string;
    pdfUrl?: string;
    item: ZoteroItemJson;
}

export interface LiteratureSearchOptions {
    providers?: LiteratureProvider[];
    limit?: number;
    adsApiKey?: string;
}

const ARXIV_API = "https://export.arxiv.org/api/query";
const ADS_API = "https://api.adsabs.harvard.edu/v1/search/query";

function textContent(parent: Element, name: string): string | undefined {
    const node = parent.getElementsByTagName(name)[0];
    const value = node?.textContent?.trim();
    return value || undefined;
}

function cleanTitle(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function arxivIdFromUrl(value: string): string | undefined {
    const match = value.match(/arxiv\.org\/(?:abs|pdf)\/([^?#/]+)/i);
    return match?.[1]?.replace(/\.pdf$/i, "");
}

function arxivItem(record: Omit<LiteratureRecord, "item">): ZoteroItemJson {
    const extra = [
        record.arxivId ? `arXiv: ${record.arxivId}` : "",
        record.doi ? `DOI: ${record.doi}` : "",
        record.bibcode ? `ADS bibcode: ${record.bibcode}` : "",
    ].filter(Boolean).join("\n");
    return {
        itemType: "journalArticle",
        title: record.title,
        creators: record.authors.map((name) => ({ name, creatorType: "author" })),
        date: record.year ?? "",
        publicationTitle: record.venue ?? "arXiv",
        abstractNote: record.abstract ?? "",
        url: record.url,
        DOI: record.doi ?? "",
        extra,
    };
}

export function parseArxivFeed(xml: string, limit = 20): LiteratureRecord[] {
    if (typeof DOMParser === "undefined") {
        const tag = (block: string, name: string): string | undefined => {
            const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(block);
            return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim() || undefined;
        };
        const entries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].slice(0, limit);
        return entries.flatMap((match): LiteratureRecord[] => {
            const block = match[1];
            const idUrl = tag(block, "id");
            const arxivId = idUrl ? arxivIdFromUrl(idUrl) : undefined;
            const title = tag(block, "title");
            if (!idUrl || !arxivId || !title) return [];
            const authors = [...block.matchAll(/<author\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)].map((entry) => entry[1].trim());
            const published = tag(block, "published");
            const pdf = /<link\b[^>]*title=["']pdf["'][^>]*href=["']([^"']+)/i.exec(block)?.[1] ?? `https://arxiv.org/pdf/${arxivId}`;
            const record: Omit<LiteratureRecord, "item"> = { provider: "arxiv", id: arxivId, arxivId, title: cleanTitle(title), authors, abstract: tag(block, "summary"), year: published?.slice(0, 4), venue: "arXiv", url: idUrl.replace("http://", "https://"), pdfUrl: pdf };
            return [{ ...record, item: arxivItem(record) }];
        });
    }
    const document = new DOMParser().parseFromString(xml, "application/xml");
    const entries = Array.from(document.getElementsByTagName("entry")).slice(0, limit);
    return entries.flatMap((entry): LiteratureRecord[] => {
        const idUrl = textContent(entry, "id");
        const arxivId = idUrl ? arxivIdFromUrl(idUrl) : undefined;
        const title = textContent(entry, "title");
        if (!idUrl || !arxivId || !title) return [];
        const authors = Array.from(entry.getElementsByTagName("author"))
            .map((author) => textContent(author, "name"))
            .filter((name): name is string => !!name);
        const published = textContent(entry, "published");
        const pdf = Array.from(entry.getElementsByTagName("link"))
            .find((link) => link.getAttribute("title") === "pdf")?.getAttribute("href")
            ?? `https://arxiv.org/pdf/${arxivId}`;
        const record: Omit<LiteratureRecord, "item"> = {
            provider: "arxiv",
            id: arxivId,
            arxivId,
            title: cleanTitle(title),
            authors,
            abstract: textContent(entry, "summary"),
            year: published?.slice(0, 4),
            venue: "arXiv",
            url: idUrl.replace("http://", "https://"),
            pdfUrl: pdf,
        };
        return [{ ...record, item: arxivItem(record) }];
    });
}

function adsRecord(doc: Record<string, unknown>): LiteratureRecord | null {
    const bibcode = typeof doc.bibcode === "string" ? doc.bibcode : "";
    const titleValue = Array.isArray(doc.title) ? doc.title[0] : doc.title;
    const title = typeof titleValue === "string" ? cleanTitle(titleValue) : "";
    if (!bibcode || !title) return null;
    const authors = Array.isArray(doc.author) ? doc.author.filter((v): v is string => typeof v === "string") : [];
    const year = typeof doc.year === "string" ? doc.year : undefined;
    const doi = Array.isArray(doc.identifier)
        ? doc.identifier.find((value): value is string => typeof value === "string" && /^doi:/i.test(value))?.replace(/^doi:/i, "")
        : undefined;
    const arxivId = Array.isArray(doc.identifier)
        ? doc.identifier.find((value): value is string => typeof value === "string" && /^arxiv:/i.test(value))?.replace(/^arxiv:/i, "")
        : undefined;
    const url = `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract`;
    const record: Omit<LiteratureRecord, "item"> = {
        provider: "ads",
        id: bibcode,
        bibcode,
        arxivId,
        title,
        authors,
        abstract: typeof doc.abstract === "string" ? doc.abstract : undefined,
        year,
        venue: typeof doc.pub === "string" ? doc.pub : undefined,
        doi,
        url,
        pdfUrl: typeof doc.link === "string" ? doc.link : undefined,
    };
    return { ...record, item: arxivItem(record) };
}

export function parseAdsResponse(value: unknown, limit = 20): LiteratureRecord[] {
    const docs = (value as { response?: { docs?: unknown[] } })?.response?.docs;
    if (!Array.isArray(docs)) return [];
    return docs.slice(0, limit).flatMap((doc) => {
        if (!doc || typeof doc !== "object") return [];
        const record = adsRecord(doc as Record<string, unknown>);
        return record ? [record] : [];
    });
}

function dedupeKey(record: LiteratureRecord): string {
    return (record.doi?.toLowerCase() || record.arxivId?.toLowerCase() || record.bibcode?.toLowerCase() || record.title.toLowerCase());
}

export function dedupeLiteratureRecords(records: LiteratureRecord[]): LiteratureRecord[] {
    const seen = new Set<string>();
    return records.filter((record) => {
        const key = dedupeKey(record);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function fetchArxiv(query: string, limit: number): Promise<LiteratureRecord[]> {
    const url = `${ARXIV_API}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`arXiv request failed (${response.status})`);
    return parseArxivFeed(await response.text(), limit);
}

async function fetchAds(query: string, limit: number, apiKey: string): Promise<LiteratureRecord[]> {
    if (!apiKey.trim()) return [];
    const url = `${ADS_API}?q=${encodeURIComponent(query)}&fl=${encodeURIComponent("bibcode,title,author,abstract,year,pub,identifier")}&rows=${limit}`;
    const response = await fetch(url, {
        credentials: "omit",
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (!response.ok) throw new Error(`NASA ADS request failed (${response.status})`);
    return parseAdsResponse(await response.json(), limit);
}

export async function searchLiterature(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureRecord[]> {
    const text = query.trim();
    if (!text) return [];
    const providers = options.providers ?? ["arxiv", "ads"];
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);
    const apiKey = options.adsApiKey ?? String(getPref("nasaAdsApiKey") || "");
    const results = await Promise.allSettled([
        providers.includes("arxiv") ? fetchArxiv(text, limit) : Promise.resolve([]),
        providers.includes("ads") ? fetchAds(text, limit, apiKey) : Promise.resolve([]),
    ]);
    const records = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    return dedupeLiteratureRecords(records).slice(0, limit * providers.length);
}

export function recordMatchesItem(record: LiteratureRecord, item: Zotero.Item): boolean {
    const doi = String(item.getField("DOI") || "").trim().toLowerCase();
    if (record.doi && doi && doi === record.doi.trim().toLowerCase()) return true;
    const extra = String(item.getField("extra") || "").toLowerCase();
    return [record.arxivId, record.bibcode].filter(Boolean).some((id) => extra.includes(String(id).toLowerCase()));
}

export async function findExistingLiteratureItem(record: LiteratureRecord, libraryIds: number[]): Promise<Zotero.Item | null> {
    for (const libraryId of libraryIds) {
        const items = await Zotero.Items.getAll(libraryId, false);
        const match = items.find((item) => !item.deleted && !item.isAttachment() && recordMatchesItem(record, item));
        if (match) return match;
    }
    return null;
}

export function metadataChangesForRecord(item: Zotero.Item, record: LiteratureRecord): Array<{ field: string; before: string; after: string }> {
    const changes: Array<{ field: string; before: string; after: string }> = [];
    const fields: Array<[string, string | undefined]> = [
        ["title", record.title],
        ["date", record.year],
        ["publicationTitle", record.venue],
        ["DOI", record.doi],
        ["url", record.url],
        ["abstractNote", record.abstract],
    ];
    for (const [field, afterValue] of fields) {
        if (!afterValue) continue;
        const before = String(item.getField(field) || "");
        if (before.trim() !== afterValue.trim()) changes.push({ field, before, after: afterValue });
    }
    return changes;
}

export async function applyMetadataChanges(item: Zotero.Item, record: LiteratureRecord): Promise<Array<{ field: string; before: string; after: string }>> {
    const changes = metadataChangesForRecord(item, record);
    for (const change of changes) item.setField(change.field, change.after);
    if (record.arxivId || record.bibcode) {
        const current = String(item.getField("extra") || "");
        const lines = [record.arxivId ? `arXiv: ${record.arxivId}` : "", record.bibcode ? `ADS bibcode: ${record.bibcode}` : ""].filter(Boolean);
        const next = [...new Set([...current.split("\n"), ...lines].filter(Boolean))].join("\n");
        if (next !== current) item.setField("extra", next);
    }
    if (changes.length > 0 || record.arxivId || record.bibcode) await item.saveTx();
    return changes;
}

export function pdfAlreadyAttached(item: Zotero.Item, record: LiteratureRecord): boolean {
    const target = record.pdfUrl?.toLowerCase();
    if (!target) return false;
    return item.getAttachments().some((id) => {
        const attachment = Zotero.Items.get(id);
        return !!attachment && String(attachment.getField("url") || "").toLowerCase() === target;
    });
}
