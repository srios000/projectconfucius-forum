import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
    vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
    vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
});

describe("r2-forum key-builders", () => {
    it("postImageKey shape", async () => {
        const { postImageKey } = await import("@/lib/storage/r2-forum");
        expect(postImageKey("abc-123", "jpg")).toBe("posts/abc-123.jpg");
    });

    it("communityImageKey shape", async () => {
        const { communityImageKey } = await import("@/lib/storage/r2-forum");
        expect(communityImageKey("cricket", "abc-123", "png")).toBe(
            "communities/cricket/abc-123.png"
        );
    });

    it("userImageKey shape", async () => {
        const { userImageKey } = await import("@/lib/storage/r2-forum");
        expect(userImageKey("u1", "abc-123", "gif")).toBe("users/u1/abc-123.gif");
    });

    it("extFromContentType maps the three allowed types", async () => {
        const { extFromContentType } = await import("@/lib/storage/r2-forum");
        expect(extFromContentType("image/jpeg")).toBe("jpg");
        expect(extFromContentType("image/png")).toBe("png");
        expect(extFromContentType("image/gif")).toBe("gif");
        expect(extFromContentType("image/webp")).toBeNull();
    });
});

describe("r2-forum public URL round-trip", () => {
    it("getForumPublicUrl joins host + key with a single slash", async () => {
        const { getForumPublicUrl } = await import("@/lib/storage/r2-forum");
        expect(getForumPublicUrl("posts/x.jpg")).toBe(
            "https://litang.projectconfucius.id/posts/x.jpg"
        );
    });

    it("parseForumObjectKey returns the key for our public host", async () => {
        const { parseForumObjectKey } = await import("@/lib/storage/r2-forum");
        expect(
            parseForumObjectKey("https://litang.projectconfucius.id/posts/x.jpg")
        ).toBe("posts/x.jpg");
    });

    it("parseForumObjectKey returns null for foreign URLs", async () => {
        const { parseForumObjectKey } = await import("@/lib/storage/r2-forum");
        expect(parseForumObjectKey("https://example.com/posts/x.jpg")).toBeNull();
        expect(parseForumObjectKey("")).toBeNull();
        expect(parseForumObjectKey(null as unknown as string)).toBeNull();
    });
});