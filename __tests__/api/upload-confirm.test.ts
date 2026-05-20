import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
const forumObjectExists = vi.fn();
vi.mock("@/lib/storage/r2-forum", async () => {
    const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
        "@/lib/storage/r2-forum",
    );
    return { ...actual, forumObjectExists };
});

beforeEach(() => {
    vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
    vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
    getSession.mockReset();
    forumObjectExists.mockReset();
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