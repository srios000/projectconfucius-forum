import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://auth.test");
});

import { patchAuthUserImage } from "@/lib/auth/patchAuthUserImage";

describe("patchAuthUserImage", () => {
    it("PATCHes the auth user image endpoint with forwarded cookie", async () => {
        fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
        const headers = new Headers({ cookie: "better-auth.session_token=abc" });
        await patchAuthUserImage(headers, "https://cdn/x.png");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://auth.test/api/user/image");
        expect(init.method).toBe("PATCH");
        expect((init.headers as Record<string, string>).cookie).toBe("better-auth.session_token=abc");
        expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ image: "https://cdn/x.png" }));
    });

    it("forwards null image (clearing)", async () => {
        fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
        await patchAuthUserImage(new Headers(), null);
        const [, init] = fetchMock.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ image: null }));
    });

    it("does not throw on non-2xx", async () => {
        fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
        await expect(patchAuthUserImage(new Headers(), "x")).resolves.toBeUndefined();
    });

    it("does not throw when fetch rejects", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network"));
        await expect(patchAuthUserImage(new Headers(), "x")).resolves.toBeUndefined();
    });
});