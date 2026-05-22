import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/lib/auth-client", () => ({ useSession: () => ({ data: { user: { id: "u1" } } }) }));
vi.mock("@/lib/queries/comments/use-create-comment-mutation", () => ({
    useCreateCommentMutation: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}));
vi.mock("@/lib/community/communityPermissions", () => ({
    checkCommunityPermission: () => true,
}));

import useCreateComment from "@/hooks/comments/useCreateComment";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreateComment", () => {
    it("bumps numberOfComments on the cached post after a successful create", async () => {
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0, numberOfComments: 3 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        const { result } = renderHook(() => useCreateComment(post), { wrapper: wrap(client) });
        await act(async () => { await result.current.createComment("hi"); });

        await waitFor(() =>
            expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.numberOfComments).toBe(4),
        );
    });
});