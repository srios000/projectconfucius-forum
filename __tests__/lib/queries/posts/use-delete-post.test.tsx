import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    deletePostAction: vi.fn(async () => undefined),
}));

import { deletePostAction } from "@/app/actions/posts";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeletePostMutation", () => {
    it("calls deletePostAction and invalidates detail + feed predicate", async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ postId: "p1" });
        });

        expect(deletePostAction).toHaveBeenCalledWith("p1");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") }),
        );
        expect(
            spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
        ).toBe(true);
    });
});

import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "@/types/post";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

describe("useDeletePostMutation — optimistic", () => {
    it("optimistically removes the post from every feed page", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
        const p1 = { id: "p1", communityId: "c1", title: "1", voteStatus: 0 } as Post;
        const p2 = { id: "p2", communityId: "c1", title: "2", voteStatus: 0 } as Post;

        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1, p2], newLastVisible: null }],
            pageParams: [null],
        });

        let resolveAction: (v: any) => void = () => { };
        (deletePostAction as any).mockImplementationOnce(
            () => new Promise((res) => { resolveAction = res; }),
        );

        const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });

        act(() => { result.current.mutate({ postId: "p1" }); });

        await waitFor(() => {
            const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
            expect(feed!.pages[0].posts.map((p) => p.id)).toEqual(["p2"]);
        });

        resolveAction(undefined);
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("rolls back the feed on error", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
        const p1 = { id: "p1", communityId: "c1", title: "1", voteStatus: 0 } as Post;

        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1], newLastVisible: null }],
            pageParams: [null],
        });

        (deletePostAction as any).mockRejectedValueOnce(new Error("nope"));

        const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });

        await act(async () => {
            try { await result.current.mutateAsync({ postId: "p1" }); } catch { }
        });

        const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
        expect(feed!.pages[0].posts.map((p) => p.id)).toEqual(["p1"]);
    });
});
