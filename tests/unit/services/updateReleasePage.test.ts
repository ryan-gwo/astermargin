import { describe, expect, it } from "vitest";
import { parseReleasePage } from "../../../src/services/updateService";

describe("GitHub release page metadata", () => {
    it("extracts the publication date and release summary when the API is unavailable", () => {
        const details = parseReleasePage(
            '<relative-time datetime="2026-11-26T01:01:37Z">26 Nov</relative-time>' +
                '<div data-test-selector="body-content" class="markdown-body"><p>AsterMargin 0.1.8</p><p>Improved updates.</p></div>',
            "0.1.8",
        );

        expect(details).toEqual({
            version: "0.1.8",
            publishedAt: "2026-11-26T01:01:37Z",
            summary: "AsterMargin 0.1.8 Improved updates.",
        });
    });
});
