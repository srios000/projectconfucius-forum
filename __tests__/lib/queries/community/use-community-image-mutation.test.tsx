import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/upload/uploadImage", () => ({
    uploadImage: vi.fn(async () => ({ imageUrl: "https://cdn/example.jpg" })),
}));

vi.mock("@/app/actions/community", () => ({
    deleteCommunityImageAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";
import {
    useUploadCommunityImageMutation,
    useDeleteCommunityImageMutation,
} from "@/lib/queries/community/use-community-image-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useUploadCommunityImageMutation", () => {
    it("calls uploadImage and invalidates community.detail + snippets", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useUploadCommunityImageMutation(), { wrapper: wrap(client) });
        const fakeBlob = new Blob(["x"], { type: "image/jpeg" });

        let returned: any;
        await act(async () => {
            returned = await result.current.mutateAsync({ communityId: "co1", blob: fakeBlob });
        });

        expect(uploadImage).toHaveBeenCalledWith("community-image", fakeBlob, "co1");
        expect(returned).toEqual({ imageUrl: "https://cdn/example.jpg" });
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
    });
});

describe("useDeleteCommunityImageMutation", () => {
    it("calls deleteCommunityImageAction and invalidates community.detail + snippets", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useDeleteCommunityImageMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityId: "co1" });
        });

        expect(deleteCommunityImageAction).toHaveBeenCalledWith("co1");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
    });
});