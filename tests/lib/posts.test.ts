import { describe, it, expect, vi } from "vitest";

const select = vi.fn();
vi.mock("@/lib/db", () => ({
    db: { select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => select() }) }) }) }) },
}));
import { getPosts } from "@/lib/posts/getPosts";

describe("getPosts", () => {
    it("returns a keyset cursor from the last row", async () => {
        const d = new Date("2026-01-01");
        select.mockResolvedValueOnce([{ id: "p1", createdAt: d, voteStatus: 0 }]);
        const r = await getPosts("c1");
        expect(r.posts).toHaveLength(1);
        expect(r.newLastVisible).toEqual({ createdAt: d, id: "p1" });
    });
    it("returns null cursor on empty", async () => {
        select.mockResolvedValueOnce([]);
        const r = await getPosts("c1");
        expect(r.newLastVisible).toBeNull();
    });
});