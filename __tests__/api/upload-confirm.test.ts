import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const isModerator = vi.fn();
vi.mock("@/lib/auth/requireModerator", () => ({ isModerator }));

const provisionLocalUser = vi.fn(async (i: { authUserId: string }) => ({ id: `local-${i.authUserId}` }));
vi.mock("@/lib/auth/provision", () => ({ provisionLocalUser }));

const findFirst = vi.fn();
const usersFindFirst = vi.fn();
const updateSet = vi.fn();
vi.mock("@/lib/db", () => ({
    db: {
        query: {
            communities: { findFirst },
            users: { findFirst: usersFindFirst },
        },
        update: () => ({ set: (v: unknown) => { updateSet(v); return { where: () => Promise.resolve() }; } }),
    },
}));

const forumObjectExists = vi.fn();
const deleteForumObject = vi.fn();
vi.mock("@/lib/storage/r2-forum", async () => {
    const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
        "@/lib/storage/r2-forum",
    );
    return { ...actual, forumObjectExists, deleteForumObject };
});

beforeEach(() => {
    vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
    vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
    getSession.mockReset();
    forumObjectExists.mockReset();
    deleteForumObject.mockReset();
    isModerator.mockReset();
    findFirst.mockReset();
    usersFindFirst.mockReset();
    updateSet.mockReset();
});

async function post(url: string, body: unknown) {
    const { POST } = await import(/* @vite-ignore */ url);
    const req = new Request("http://test.local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    return POST(req);
}

describe("POST /api/upload/post-image/confirm", () => {
    it("401 unauthenticated", async () => {
        getSession.mockResolvedValueOnce(null);
        const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
        expect(res.status).toBe(401);
    });

    it("400 HeadObject misses", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1" } });
        forumObjectExists.mockResolvedValueOnce(false);
        const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
        expect(res.status).toBe(400);
    });

    it("200 returns imageUrl without touching the DB", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1" } });
        forumObjectExists.mockResolvedValueOnce(true);
        const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.imageUrl).toBe("https://litang.projectconfucius.id/posts/x.jpg");
    });
});

describe("POST /api/upload/community-image/confirm", () => {
    it("403 not a moderator", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(false);
        const res = await post(
            "@/app/api/upload/community-image/confirm/route",
            { key: "communities/cricket/abc.jpg", communityId: "cricket" },
        );
        expect(res.status).toBe(403);
    });

    it("400 HeadObject misses", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(true);
        forumObjectExists.mockResolvedValueOnce(false);
        const res = await post(
            "@/app/api/upload/community-image/confirm/route",
            { key: "communities/cricket/abc.jpg", communityId: "cricket" },
        );
        expect(res.status).toBe(400);
    });

    it("200 updates row + deletes old key", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(true);
        forumObjectExists.mockResolvedValueOnce(true);
        findFirst.mockResolvedValueOnce({
            imageUrl: "https://litang.projectconfucius.id/communities/cricket/old.jpg",
        });
        deleteForumObject.mockResolvedValueOnce(undefined);

        const res = await post(
            "@/app/api/upload/community-image/confirm/route",
            { key: "communities/cricket/abc.jpg", communityId: "cricket" },
        );
        expect(res.status).toBe(200);
        expect(updateSet).toHaveBeenCalledWith(
            expect.objectContaining({
                imageUrl: "https://litang.projectconfucius.id/communities/cricket/abc.jpg",
            }),
        );
        expect(deleteForumObject).toHaveBeenCalledWith("communities/cricket/old.jpg");
    });

    it("200 even if old-key delete fails (best-effort)", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(true);
        forumObjectExists.mockResolvedValueOnce(true);
        findFirst.mockResolvedValueOnce({
            imageUrl: "https://litang.projectconfucius.id/communities/cricket/old.jpg",
        });
        deleteForumObject.mockRejectedValueOnce(new Error("R2 down"));
        const res = await post(
            "@/app/api/upload/community-image/confirm/route",
            { key: "communities/cricket/abc.jpg", communityId: "cricket" },
        );
        expect(res.status).toBe(200);
    });
});

describe("POST /api/upload/profile-image/confirm", () => {
    it("200 updates row + deletes old key", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        forumObjectExists.mockResolvedValueOnce(true);
        usersFindFirst.mockResolvedValueOnce({
            imageUrl: "https://litang.projectconfucius.id/users/local-a1/old.jpg",
        });
        deleteForumObject.mockResolvedValueOnce(undefined);

        const res = await post(
            "@/app/api/upload/profile-image/confirm/route",
            { key: "users/local-a1/abc.jpg" },
        );
        expect(res.status).toBe(200);
        expect(updateSet).toHaveBeenCalledWith(
            expect.objectContaining({
                imageUrl: "https://litang.projectconfucius.id/users/local-a1/abc.jpg",
            }),
        );
        expect(deleteForumObject).toHaveBeenCalledWith("users/local-a1/old.jpg");
    });

    it("403 if the key is under a different user", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        const res = await post(
            "@/app/api/upload/profile-image/confirm/route",
            { key: "users/local-OTHER/abc.jpg" },
        );
        expect(res.status).toBe(403);
    });
});
