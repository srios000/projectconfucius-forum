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
        client.setQueryData(
            keys.posts.feed({ scope: { communityId: "c1" }, cursor: null }),
            { posts: [], newLastVisible: null },
        );
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