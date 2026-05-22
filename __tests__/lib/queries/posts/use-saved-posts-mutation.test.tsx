import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    savePostAction: vi.fn(async (post: any) => ({
        id: post.id,
        postId: post.id,
        communityId: post.communityId,
        postTitle: post.title,
        communityImageUrl: post.communityImageUrl,
    })),
    unsavePostAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import {
    savePostAction,
    unsavePostAction,
} from "@/app/actions/posts";
import {
    useSavePostMutation,
    useUnsavePostMutation,
} from "@/lib/queries/posts/use-saved-posts-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useSavePostMutation", () => {
    it("calls savePostAction and invalidates posts.saved(userId) on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useSavePostMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                id: "p1",
                communityId: "c1",
                title: "t",
                communityImageUrl: undefined,
            } as any);
        });

        expect(savePostAction).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.saved("u1") }),
        );
    });
});

describe("useUnsavePostMutation", () => {
    it("calls unsavePostAction and invalidates posts.saved(userId) on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useUnsavePostMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ postId: "p1" });
        });

        expect(unsavePostAction).toHaveBeenCalledWith("p1");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.saved("u1") }),
        );
    });
});