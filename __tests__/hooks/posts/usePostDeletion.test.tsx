import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/app/actions/posts", () => ({
    deletePostAction: vi.fn(async () => undefined),
}));

import usePostDeletion from "@/hooks/posts/usePostDeletion";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostDeletion (shell)", () => {
    it("removes the post from the infinite feed optimistically and returns true", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const p1 = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1], newLastVisible: null }],
            pageParams: [null],
        });

        const { result } = renderHook(() => usePostDeletion(), { wrapper: wrap(client) });

        let outcome: boolean | undefined;
        await act(async () => { outcome = await result.current.onDeletePost(p1); });

        expect(outcome).toBe(true);
        await waitFor(() => {
            const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
            expect(feed!.pages[0].posts).toHaveLength(0);
        });
    });
});