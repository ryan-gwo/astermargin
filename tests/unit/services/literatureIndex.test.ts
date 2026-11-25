import { describe, expect, it } from "vitest";
import { dedupeLiteratureRecords, parseAdsResponse, parseArxivFeed } from "../../../src/services/literatureIndex";
import { parseSelectedPages } from "../../../src/services/ocr/evaluation";

describe("literature indexes", () => {
    it("parses arXiv Atom records into Zotero metadata", () => {
        const records = parseArxivFeed(`<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>https://arxiv.org/abs/1602.03837</id><title>  A discovery  </title><summary>Abstract text</summary><published>2016-02-11T00:00:00Z</published><author><name>Abbott, B.</name></author><link title="pdf" href="https://arxiv.org/pdf/1602.03837" /></entry></feed>`);
        expect(records[0]).toMatchObject({ arxivId: "1602.03837", title: "A discovery", year: "2016", pdfUrl: "https://arxiv.org/pdf/1602.03837" });
        expect(records[0].item.extra).toContain("arXiv: 1602.03837");
    });

    it("parses ADS records and deduplicates matching identifiers", () => {
        const ads = parseAdsResponse({ response: { docs: [{ bibcode: "2016PhRvL.116f1102A", title: ["A discovery"], author: ["Abbott"], year: "2016", identifier: ["doi:10.1103/PhysRevLett.116.061102"] }] } });
        expect(ads[0].doi).toBe("10.1103/PhysRevLett.116.061102");
        expect(dedupeLiteratureRecords([ads[0], { ...ads[0], provider: "arxiv", id: "other", arxivId: "1602.03837" }])).toHaveLength(1);
    });
});

describe("manual OCR page selection", () => {
    it("expands ranges and removes duplicates", () => {
        expect(parseSelectedPages("7,3-5,5,invalid")).toEqual([3, 4, 5, 7]);
    });
});
