import { describe, expect, it } from "vitest";
import { resolveManageCollectionsSnapshot } from "../../../react/host/zotero/components/ManageCollectionsPreview";

describe("resolveManageCollectionsSnapshot", () => {
  it("prefers the persisted old name over the post-rename live name", () => {
    const snapshot = resolveManageCollectionsSnapshot(
      undefined,
      {
        library_id: 1,
        action: "rename",
        collection_key: "ABCDEFGH",
        new_name: "AsterMargin Test NEW",
        old_name: "AsterMargin Test",
      },
      { collectionName: "AsterMargin Test NEW" },
    );

    expect(snapshot.collectionName).toBe("AsterMargin Test");
  });

  it("prefers the persisted old parent over the post-move live parent", () => {
    const snapshot = resolveManageCollectionsSnapshot(
      undefined,
      {
        library_id: 1,
        action: "move",
        collection_key: "ABCDEFGH",
        new_parent_key: "NEWPAREN",
        old_parent_key: "OLDPAREN",
      },
      { oldParentKey: "NEWPAREN" },
    );

    expect(snapshot.oldParentKey).toBe("OLDPAREN");
  });

  it("preserves a persisted top-level parent over the post-move live parent", () => {
    const snapshot = resolveManageCollectionsSnapshot(
      undefined,
      {
        library_id: 1,
        action: "move",
        collection_key: "ABCDEFGH",
        new_parent_key: "NEWPAREN",
        old_parent_key: null,
      },
      { oldParentKey: "NEWPAREN" },
    );

    expect(snapshot.oldParentKey).toBeNull();
  });

  it("uses live data when no validation or persisted snapshot is available", () => {
    const snapshot = resolveManageCollectionsSnapshot(undefined, undefined, {
      collectionName: "Current collection",
      oldParentKey: "CURRENTP",
    });

    expect(snapshot).toEqual({
      collectionName: "Current collection",
      oldParentKey: "CURRENTP",
    });
  });
});
