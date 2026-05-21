import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    voteAction: vi.fn(async () => ({
        voteChange: 1,
        newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1, userId: "u1" },
        voteIdToDelete: null,
    })),
}));

import { voteAction } from "@/app/actions/posts";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostVoteMutation", () => {
    it("calls voteAction and invalidates detail + feed + votes on success", async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        const spy = vi.spyOn(client, "invalidateQueries");
        client.setQueryData(keys.posts.detail("p1"), { id: "p1", title: "before" });
        client.setQueryData(keys.posts.votes("c1"), []);

        const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                post: { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as any,
                vote: 1,
                communityId: "c1",
            });
        });

        expect(voteAction).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.votes("c1") });
        expect(
            spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
        ).toBe(true);
    });
});

import type { InfiniteData } from "@tanstack/react-query";
import type { Post, PostVote } from "@/types/post";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

describe("usePostVoteMutation — optimistic", () => {
    it("optimistically updates detail + votes + infinite feed before the action resolves", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;

        client.setQueryData(keys.posts.detail("p1"), post);
        client.setQueryData<PostVote[]>(keys.posts.votes("c1"), []);
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [post], newLastVisible: null }],
            pageParams: [null],
        });

        // Make the action hang so we can observe the optimistic state mid-flight.
        let resolveAction: (v: any) => void = () => { };
        (voteAction as any).mockImplementationOnce(
            () => new Promise((res) => { resolveAction = res; }),
        );

        const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

        act(() => {
            result.current.mutate({ post, vote: 1, communityId: "c1" });
        });

        // Optimistic state visible before action resolves
        await waitFor(() => {
            const d = client.getQueryData<Post>(keys.posts.detail("p1"));
            expect(d?.voteStatus).toBe(1);
        });

        const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
        expect(feed!.pages[0].posts[0].voteStatus).toBe(1);

        const votes = client.getQueryData<PostVote[]>(keys.posts.votes("c1"));
        expect(votes!.length).toBe(1);
        expect(votes![0].voteValue).toBe(1);

        resolveAction({ voteChange: 1, newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 }, voteIdToDelete: null });
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("rolls back detail + votes + infinite feed on error", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;

        client.setQueryData(keys.posts.detail("p1"), post);
        client.setQueryData<PostVote[]>(keys.posts.votes("c1"), []);
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [post], newLastVisible: null }],
            pageParams: [null],
        });

        (voteAction as any).mockRejectedValueOnce(new Error("server down"));

        const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

        await act(async () => {
            try { await result.current.mutateAsync({ post, vote: 1, communityId: "c1" }); } catch { }
        });

        expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.voteStatus).toBe(0);
        expect(client.getQueryData<PostVote[]>(keys.posts.votes("c1"))).toEqual([]);
        expect(client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }))!.pages[0].posts[0].voteStatus).toBe(0);
    });
});
