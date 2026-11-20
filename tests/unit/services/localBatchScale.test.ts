import { describe, expect, it } from "vitest";
import DB from "better-sqlite3";
import { LocalHistory } from "../../../src/services/threads/localHistory";
describe("durable batch accounting", () => {
    it.each([
        ["tag", 1000],
        ["extract", 180],
        ["note", 100],
    ] as const)(
        "keeps a receipt per %s target, resumes after interruption and refuses duplicate claims",
        async (kind, n) => {
            const disk = new DB(":memory:");
            disk.pragma("foreign_keys=on");
            const repo = new LocalHistory(
                async (sql, args = []) => {
                    const st = disk.prepare(sql);
                    if (st.reader) return st.all(...args);
                    st.run(...args);
                    return [];
                },
                async (work) => {
                    disk.exec("BEGIN");
                    try {
                        await work();
                        disk.exec("COMMIT");
                    } catch (error) {
                        disk.exec("ROLLBACK");
                        throw error;
                    }
                },
            );
            try {
                await repo.initialize();
                await repo.createJob(
                    "job",
                    kind,
                    "question",
                    [1],
                    Array.from(
                        { length: n },
                        (_, i) => "u-" + i.toString().padStart(8, "0"),
                    ),
                );
                for (let i = 0; i < n; i++) {
                    expect(await repo.claimRow("job", i, false)).toBe(true);
                    if (i === 1) continue;
                    await repo.finishRow(
                        "job",
                        i,
                        i === 2 ? "failed" : "done",
                        { usage: { input: 10, output: 5 } },
                    );
                }
                await repo.initialize();
                const j = await repo.job("job");
                expect(j.rows).toHaveLength(n);
                expect(j.rows.filter((r) => r.status === "done")).toHaveLength(
                    n - 2,
                );
                expect(j.rows[1].status).toBe("review");
                expect(await repo.claimRow("job", 1, true)).toBe(false);
                expect(await repo.claimRow("job", 2, true)).toBe(true);
                expect(await repo.claimRow("job", 2, true)).toBe(false);
                expect(await repo.claimRow("job", 0, true)).toBe(false);
            } finally {
                disk.close();
            }
        },
    );
});
