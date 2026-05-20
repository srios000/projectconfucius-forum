import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("@/lib/storage/r2-forum", async () => {
    const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
        "@/lib/storage/r2-forum",
    );
    return {
        ...actual,
        generateForumPresignedPutUrl: vi.fn(async (k: string) => `https://signed.test/${k}`),
    };
});

beforeEach(() => {
    vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
    vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
    getSession.mockReset();
});

async function post(url: string, body: unknown) {
    const { POST } = await import(
    /* @vite-ignore */ url
    );
    const req = new Request("http://test.local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    return POST(req);
}

describe("POST /api/upload/post-image/presign", () => {
    it("401 unauthenticated", async () => {
        getSession.mockResolvedValueOnce(null);
        const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/jpeg" });
        expect(res.status).toBe(401);
    });

    it("400 disallowed content-type", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1" } });
        const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/webp" });
        expect(res.status).toBe(400);
    });

    it("200 happy path returns presignedUrl + key + publicUrl + maxSize", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1" } });
        const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/jpeg" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.presignedUrl).toMatch(/^https:\/\/signed\.test\//);
        expect(json.key).toMatch(/^posts\/[0-9a-f-]+\.jpg$/);
        expect(json.publicUrl).toMatch(/^https:\/\/litang\.projectconfucius\.id\/posts\//);
        expect(json.maxSize).toBe(10 * 1024 * 1024);
    });
});

const isModerator = vi.fn();
vi.mock("@/lib/auth/requireModerator", () => ({ isModerator }));
const provisionLocalUser = vi.fn(async (i: { authUserId: string }) => ({ id: `local-${i.authUserId}` }));
vi.mock("@/lib/auth/provision", () => ({ provisionLocalUser }));

describe("POST /api/upload/community-image/presign", () => {
    it("401 unauthenticated", async () => {
        getSession.mockResolvedValueOnce(null);
        const res = await post(
            "@/app/api/upload/community-image/presign/route",
            { contentType: "image/jpeg", communityId: "cricket" },
        );
        expect(res.status).toBe(401);
    });

    it("400 disallowed content-type", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        const res = await post(
            "@/app/api/upload/community-image/presign/route",
            { contentType: "image/webp", communityId: "cricket" },
        );
        expect(res.status).toBe(400);
    });

    it("403 not a moderator", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(false);
        const res = await post(
            "@/app/api/upload/community-image/presign/route",
            { contentType: "image/jpeg", communityId: "cricket" },
        );
        expect(res.status).toBe(403);
    });

    it("200 happy path returns key under communities/<id>/", async () => {
        getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
        isModerator.mockResolvedValueOnce(true);
        const res = await post(
            "@/app/api/upload/community-image/presign/route",
            { contentType: "image/jpeg", communityId: "cricket" },
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.key).toMatch(/^communities\/cricket\/[0-9a-f-]+\.jpg$/);
    });
});


