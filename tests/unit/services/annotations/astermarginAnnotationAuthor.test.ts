import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/services/agentDataProvider/utils", () => ({
  getAttachmentFileStatus: vi.fn(),
}));

import { createHighlightAnnotation } from "../../../../src/services/annotations/createAnnotation";
import {
  ASTERMARGIN_ANNOTATION_AUTHOR,
  ASTERMARGIN_CITATION_ANNOTATION_AUTHOR,
  getAsterMarginAnnotationAuthorName,
  isAsterMarginAuthoredAnnotation,
} from "../../../../src/constants/annotations";
import {
  markAsterMarginAnnotationWrite,
  markAsterMarginAnnotationWriteByKey,
  wasWrittenByAsterMargin,
} from "../../../../src/services/annotations/astermarginAnnotationRegistry";
import { CoordOrigin } from "@astermargin/agent-core/types/citations";
import type { PageGeometry } from "@astermargin/agent-core/extract/types";

const geometry: PageGeometry = {
  viewBox: [0, 0, 400, 600],
  width: 400,
  height: 600,
  rotation: 0,
};

const PREF_KEY = "extensions.zotero.astermargin.annotationAuthorName";

/** Fields whose assignment makes Zotero mark an item's primary data loaded. */
const ANNOTATION_FIELDS = [
  "parentID",
  "annotationType",
  "annotationComment",
  "annotationColor",
  "annotationText",
  "annotationPageLabel",
  "annotationSortIndex",
  "annotationPosition",
  "annotationAuthorName",
];

let constructedItems: any[] = [];
/** Registry answer captured from inside saveTx — the notifier runs there. */
let registeredAtSave: boolean | null = null;

/** Key Zotero generates for the annotation while saving it. */
const SAVED_KEY = "SAVEDKEY1";

/**
 * Stands in for a new `Zotero.Item("annotation")`. Setting any field marks
 * primary data loaded; Zotero then refuses an identifier change, so `key` /
 * `libraryID` assigned after the first field throws. Saving generates the key.
 */
class MockAnnotationItem {
  saveTx = vi.fn(async () => {
    this.assignKeyOnSave();
    registeredAtSave = wasWrittenByAsterMargin(this as unknown as Zotero.Item);
  });
  save = vi.fn(async () => this.assignKeyOnSave());
  /** Set by the save, bypassing the identifier guard as Zotero's save does. */
  private assignKeyOnSave: () => void;

  constructor(public readonly itemType: string) {
    constructedItems.push(this);
    const values: Record<string, unknown> = { libraryID: 1, key: "" };
    let loaded = false;

    for (const field of ANNOTATION_FIELDS) {
      Object.defineProperty(this, field, {
        get: () => values[field],
        set: (value: unknown) => {
          loaded = true;
          values[field] = value;
        },
        configurable: true,
      });
    }
    for (const identifier of ["key", "libraryID"]) {
      Object.defineProperty(this, identifier, {
        get: () => values[identifier],
        set: (value: unknown) => {
          if (loaded) {
            throw new Error(`Cannot change ${identifier} after object is already loaded`);
          }
          values[identifier] = value;
        },
        configurable: true,
      });
    }
    this.assignKeyOnSave = () => {
      if (!values.key) values.key = SAVED_KEY;
    };
  }

  addTag(): void {}
}

function mockAttachment() {
  return {
    isAttachment: () => true,
    attachmentContentType: "application/pdf",
    libraryID: 1,
    id: 42,
    key: "ATT123",
    getFilePathAsync: vi.fn().mockResolvedValue("/local/path/file.pdf"),
  } as unknown as Zotero.Item;
}

function createHighlight() {
  return createHighlightAnnotation(mockAttachment(), {
    pageIndex: 0,
    boxes: [{ l: 10, t: 20, r: 110, b: 50, coord_origin: CoordOrigin.TOPLEFT }],
    text: "highlighted text",
  });
}

describe("AsterMargin annotation authorship", () => {
  let previousZotero: any;
  let prefs: Record<string, unknown>;
  let currentUserName: string;

  beforeEach(() => {
    vi.clearAllMocks();
    constructedItems = [];
    registeredAtSave = null;
    prefs = {};
    currentUserName = "";
    previousZotero = (globalThis as any).Zotero;
    (globalThis as any).Zotero = {
      Item: MockAnnotationItem,
      Attachments: { LINK_MODE_LINKED_URL: 3 },
      DB: { inTransaction: () => false },
      Prefs: { get: (key: string) => prefs[key] },
      Users: { getCurrentName: () => currentUserName },
      AsterMargin: {
        documentCache: {
          getMetadata: vi.fn().mockResolvedValue({ pages: [geometry] }),
        },
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as any).Zotero = previousZotero;
  });

  describe("author name", () => {
    it("falls back to the default when the preference is unset", async () => {
      await createHighlight();
      expect(constructedItems[0].annotationAuthorName).toBe(ASTERMARGIN_ANNOTATION_AUTHOR);
    });

    it("stamps the configured author name", async () => {
      prefs[PREF_KEY] = "  Research Assistant  ";
      await createHighlight();
      expect(constructedItems[0].annotationAuthorName).toBe("Research Assistant");
    });

    it("leaves the author empty when the preference is cleared", async () => {
      prefs[PREF_KEY] = "";
      await createHighlight();
      expect(constructedItems[0].annotationAuthorName).toBe("");
      expect(getAsterMarginAnnotationAuthorName()).toBe("");
    });
  });

  describe("write registry", () => {
    it("records the annotation before saving it", async () => {
      prefs[PREF_KEY] = "";
      await createHighlight();
      // Observers run inside saveTx; a record made afterwards is too late.
      expect(registeredAtSave).toBe(true);
    });

    it("leaves the annotation's identifiers to Zotero", async () => {
      // Zotero refuses an identifier change once a field has been set.
      const reference = await createHighlight();
      expect(constructedItems[0].saveTx).toHaveBeenCalledTimes(1);
      expect(reference.zotero_key).toBe(SAVED_KEY);
    });

    it("does not claim annotations AsterMargin never wrote", () => {
      const astermarginItem = new MockAnnotationItem("annotation") as unknown as Zotero.Item;
      const userItem = new MockAnnotationItem("annotation") as unknown as Zotero.Item;
      markAsterMarginAnnotationWrite(astermarginItem);
      expect(wasWrittenByAsterMargin(astermarginItem)).toBe(true);
      expect(wasWrittenByAsterMargin(userItem)).toBe(false);
    });

    it("matches a reader write by library and key", () => {
      markAsterMarginAnnotationWriteByKey(1, "ASTERMARGINKEY");
      const item = new MockAnnotationItem("annotation") as unknown as Zotero.Item;
      (item as unknown as { key: string }).key = "ASTERMARGINKEY";
      expect(wasWrittenByAsterMargin(item)).toBe(true);

      const otherLibraryItem = new MockAnnotationItem("annotation") as any;
      otherLibraryItem.key = "ASTERMARGINKEY";
      otherLibraryItem.libraryID = 2;
      expect(wasWrittenByAsterMargin(otherLibraryItem)).toBe(false);
    });

    it("stops matching a reader write once the retention window passes", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-16T12:00:00Z"));
      markAsterMarginAnnotationWriteByKey(1, "ASTERMARGINKEY");
      const item = new MockAnnotationItem("annotation") as any;
      item.key = "ASTERMARGINKEY";

      vi.setSystemTime(new Date("2026-08-16T12:04:00Z"));
      expect(wasWrittenByAsterMargin(item)).toBe(true);
      vi.setSystemTime(new Date("2026-08-16T12:06:00Z"));
      expect(wasWrittenByAsterMargin(item)).toBe(false);
    });

    it("evicts the oldest reader writes once the cap is reached", () => {
      markAsterMarginAnnotationWriteByKey(1, "OLDESTKEY");
      for (let i = 0; i < 500; i++) {
        markAsterMarginAnnotationWriteByKey(1, `KEY${i}`);
      }
      const oldest = new MockAnnotationItem("annotation") as any;
      oldest.key = "OLDESTKEY";
      const newest = new MockAnnotationItem("annotation") as any;
      newest.key = "KEY499";

      expect(wasWrittenByAsterMargin(oldest)).toBe(false);
      expect(wasWrittenByAsterMargin(newest)).toBe(true);
    });
  });

  describe("isAsterMarginAuthoredAnnotation", () => {
    it("matches the built-in names even after the author is renamed", () => {
      prefs[PREF_KEY] = "";
      expect(isAsterMarginAuthoredAnnotation(ASTERMARGIN_ANNOTATION_AUTHOR)).toBe(true);
      expect(isAsterMarginAuthoredAnnotation(ASTERMARGIN_CITATION_ANNOTATION_AUTHOR)).toBe(true);
    });

    it("matches the configured author name", () => {
      prefs[PREF_KEY] = "Research Assistant";
      expect(isAsterMarginAuthoredAnnotation("Research Assistant")).toBe(true);
    });

    it("ignores annotations with no author", () => {
      expect(isAsterMarginAuthoredAnnotation("")).toBe(false);
      expect(isAsterMarginAuthoredAnnotation(null)).toBe(false);
      expect(isAsterMarginAuthoredAnnotation(undefined)).toBe(false);
    });

    it("does not claim the user's own name when they configure it as the author", () => {
      // Matching that name would drop the user's own annotations from auto-attach.
      prefs[PREF_KEY] = "Ada Lovelace";
      currentUserName = "Ada Lovelace";
      expect(isAsterMarginAuthoredAnnotation("Ada Lovelace")).toBe(false);
    });
  });
});
