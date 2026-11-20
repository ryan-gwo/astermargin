import { expect, it, vi } from "vitest";
import { AsterMarginDB } from "../../../src/services/database";
import { MockDBConnection } from "../../mocks/mockDBConnection";

it("closes the connection permanently so late queries cannot reopen it", async () => {
    const connection = new MockDBConnection();
    const close = vi.spyOn(connection, "closeDatabase");
    const db = new AsterMarginDB(connection);

    await db.closeDatabase();

    expect(close).toHaveBeenCalledWith(true);
});
