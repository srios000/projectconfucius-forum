import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/lib/queries/comments/use-delete-comment-mutation", () => ({
    useDeleteCommentMutation: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}));
vi.mock("@/hooks/useCustomToast", () => ({ default: () => vi.fn() }));

import useDeleteComment from "@/hooks/comments/useDeleteComment";
import type { Comment } from "@/types/comment";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeleteComment", () => {
    it("decrements numberOfComments on the cached post after a successful delete", async () => {
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0, numberOfComments: 3 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        const { result } = renderHook(() => useDeleteComment(), { wrapper: wrap(client) });
        await act(async () => {
            await result.current.deleteComment({ id: "cm1", postId: "p1" } as Comment);
        });

        await waitFor(() =>
            expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.numberOfComments).toBe(2),
        );
    });
});
