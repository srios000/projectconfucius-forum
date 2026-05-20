import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

describe("uploadImage", () => {
    it("presigns, PUTs to R2, confirms, returns imageUrl", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        presignedUrl: "https://signed.test/key",
                        key: "posts/abc.jpg",
                        publicUrl: "https://litang.projectconfucius.id/posts/abc.jpg",
                        maxSize: 10485760,
                    }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response("", { status: 200 }))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        imageUrl: "https://litang.projectconfucius.id/posts/abc.jpg",
                    }),
                    { status: 200 },
                ),
            );

        const { uploadImage } = await import("@/lib/upload/uploadImage");
        const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
        const { imageUrl } = await uploadImage("post-image", blob);
        expect(imageUrl).toBe("https://litang.projectconfucius.id/posts/abc.jpg");

        expect(fetchMock.mock.calls[0][0]).toBe("/api/upload/post-image/presign");
        expect(fetchMock.mock.calls[1][0]).toBe("https://signed.test/key");
        expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
        expect(fetchMock.mock.calls[2][0]).toBe("/api/upload/post-image/confirm");
    });

    it("throws on presign 4xx", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ message: "Invalid content type" }), { status: 400 }),
        );
        const { uploadImage } = await import("@/lib/upload/uploadImage");
        const blob = new Blob([new Uint8Array(8)], { type: "image/webp" });
        await expect(uploadImage("post-image", blob)).rejects.toThrow(/Invalid content type/);
    });

    it("throws on R2 PUT failure", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        presignedUrl: "https://signed.test/key",
                        key: "posts/abc.jpg",
                        publicUrl: "x",
                        maxSize: 1,
                    }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response("", { status: 500 }));
        const { uploadImage } = await import("@/lib/upload/uploadImage");
        const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
        await expect(uploadImage("post-image", blob)).rejects.toThrow(/upload to R2/i);
    });

    it("passes communityId for community-image surface", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        presignedUrl: "https://signed.test/key",
                        key: "communities/c1/abc.jpg",
                        publicUrl: "x",
                        maxSize: 1,
                    }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response("", { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: "x" }), { status: 200 }));
        const { uploadImage } = await import("@/lib/upload/uploadImage");
        const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
        await uploadImage("community-image", blob, "c1");
        const presignBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
        const confirmBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
        expect(presignBody.communityId).toBe("c1");
        expect(confirmBody.communityId).toBe("c1");
    });
});