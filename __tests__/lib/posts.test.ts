import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();
const insertValues = vi.fn();
vi.mock("@/lib/db", () => ({
    db: {
        select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => select() }) }) }) }),
        insert: () => ({ values: (row: unknown) => insertValues(row) }),
    },
}));
import { getPosts } from "@/lib/posts/getPosts";
import { createPost } from "@/lib/posts/createPost";

beforeEach(() => {
    insertValues.mockClear();
    select.mockClear();
});

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

describe("createPost", () => {
    it("writes author.username verbatim to creatorUsername", async () => {
        insertValues.mockResolvedValueOnce(undefined);
        await createPost(
            { id: "u1", username: "alice" },
            "c1",
            undefined,
            { title: "t", body: "b" },
        );
        expect(insertValues).toHaveBeenCalledTimes(1);
        expect(insertValues.mock.calls[0][0]).toMatchObject({
            creatorId: "u1",
            creatorUsername: "alice",
            communityId: "c1",
            communityImageUrl: null,
            title: "t",
            body: "b",
            imageUrl: null,
            numberOfComments: 0,
            voteStatus: 0,
        });
    });

    it("writes null creatorUsername when username is null", async () => {
        insertValues.mockResolvedValueOnce(undefined);
        await createPost(
            { id: "u1", username: null },
            "c1",
            undefined,
            { title: "t", body: "b" },
        );
        expect(insertValues.mock.calls[0][0]).toMatchObject({ creatorUsername: null });
    });
});