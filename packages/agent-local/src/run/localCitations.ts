import {
    CITATION_TAG_PATTERN,
    parseRawCitationAttributes,
    normalizeCitationTag,
} from "@astermargin/agent-core/citations/citationGrammar";
import type {
    Citation,
    PartLocation,
} from "@astermargin/agent-core/types/citations";

export interface PassageEvidence {
    id: string;
    location: PartLocation;
    page: number;
    text: string;
}

interface ReadResult {
    attachment_id: string;
    content_kind?: Citation["content_kind"];
    parent_item?: {
        title?: string;
        display_name?: string;
        formatted_citation?: string;
        item_id?: string;
    };
    evidence: PassageEvidence[];
}

/** Resolve only tags backed by passages returned by a successful read in this run. */
export class LocalCitations {
    private passages = new Map<
        string,
        { read: ReadResult; passage: PassageEvidence }
    >();
    private cited = new Map<string, Citation>();

    record(content: Record<string, unknown> | string) {
        if (
            typeof content === "string" ||
            !Array.isArray(content.evidence) ||
            typeof content.attachment_id !== "string"
        )
            return;
        const read = content as unknown as ReadResult;
        for (const passage of read.evidence)
            this.passages.set(read.attachment_id + "#" + passage.id, {
                read,
                passage,
            });
    }
    find(text: string, runId: string) {
        for (const match of text.matchAll(new RegExp(CITATION_TAG_PATTERN))) {
            const attrs = parseRawCitationAttributes(match[1]);
            const key = attrs.id + "#" + attrs.loc;
            const source = this.passages.get(key);
            if (!source || this.cited.has(key)) continue;
            const target = normalizeCitationTag(attrs);
            if (!target.ok || target.ref.kind !== "zotero") continue;
            const { read, passage } = source;
            const parent = read.parent_item?.item_id
                ? normalizeCitationTag({ id: read.parent_item.item_id })
                : null;
            this.cited.set(key, {
                citation_id: runId + ":" + key,
                requested_ref: target.ref,
                resolved_ref: target.ref,
                ...(parent?.ok && parent.ref.kind === "zotero"
                    ? { parent_ref: parent.ref }
                    : {}),
                citation_type: "attachment",
                content_kind: read.content_kind,
                raw_tag: match[0],
                display_name:
                    read.parent_item?.display_name ||
                    read.parent_item?.title ||
                    read.attachment_id,
                formatted_citation: read.parent_item?.formatted_citation,
                preview: passage.text,
                pages: [passage.page],
                locations: [passage.location],
            });
        }
        return [...this.cited.values()];
    }
}
