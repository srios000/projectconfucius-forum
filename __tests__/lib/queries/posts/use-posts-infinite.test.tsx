import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/reads", () => ({
    getPostsAction: vi.fn(),
}));

import { getPostsAction } from "@/app/actions/reads";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostsInfiniteQuery", () => {
    it("loads page 1, then fetchNextPage appends page 2 with its cursor", async () => {
        (getPostsAction as any)
            .mockResolvedValueOnce({ posts: [{ id: "p1", communityId: "c1", title: "1", voteStatus: 0 }], newLastVisible: "cursor1" })
            .mockResolvedValueOnce({ posts: [{ id: "p2", communityId: "c1", title: "2", voteStatus: 0 }], newLastVisible: null });

        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const { result } = renderHook(
            () => usePostsInfiniteQuery({ scope: { communityId: "c1" } }),
            { wrapper: wrap(client) },
        );

        await waitFor(() => expect(result.current.data?.pages.length).toBe(1));
        expect(result.current.hasNextPage).toBe(true);
        expect(getPostsAction).toHaveBeenLastCalledWith("c1", undefined, undefined, null, undefined, undefined);

        await act(async () => { await result.current.fetchNextPage(); });

        await waitFor(() => expect(result.current.data?.pages.length).toBe(2));
        expect(result.current.hasNextPage).toBe(false);
        expect(getPostsAction).toHaveBeenLastCalledWith("c1", undefined, undefined, "cursor1", undefined, undefined);
    });

    it("respects enabled=false (does not call action)", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => usePostsInfiniteQuery({ scope: { communityId: "c1" }, enabled: false }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostsAction).not.toHaveBeenCalled();
    });
});
