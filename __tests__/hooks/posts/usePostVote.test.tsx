import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/app/actions/posts", () => ({
    voteAction: vi.fn(async () => ({ voteChange: 1, newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 }, voteIdToDelete: null })),
    getPostVotesAction: vi.fn(),
    getCommunityPostVotesAction: vi.fn(async () => []),
}));
vi.mock("@/app/actions/reads", () => ({
    getCommunityDataAction: vi.fn(async () => ({ id: "c1", privacyType: "public" })),
}));
vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1", email: "u@x" } } }),
}));

import usePostVote from "@/hooks/posts/usePostVote";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostVote (shell)", () => {
    it("invokes mutation and updates keys.posts.detail optimistically", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        const { result } = renderHook(() => usePostVote(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.onVote({ stopPropagation: () => { } } as any, post, 1, "c1");
        });

        await waitFor(() => expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.voteStatus).toBe(1));
    });

    it("isVotePending(postId) reflects in-flight vote", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        let resolveAction: (v: any) => void = () => { };
        const { voteAction } = await import("@/app/actions/posts");
        (voteAction as any).mockImplementationOnce(() => new Promise((res) => { resolveAction = res; }));

        const { result } = renderHook(() => usePostVote(), { wrapper: wrap(client) });

        act(() => { void result.current.onVote({ stopPropagation: () => { } } as any, post, 1, "c1"); });

        await waitFor(() => expect(result.current.isVotePending("p1")).toBe(true));
        resolveAction({ voteChange: 1, newVote: null, voteIdToDelete: null });
        await waitFor(() => expect(result.current.isVotePending("p1")).toBe(false));
    });
});