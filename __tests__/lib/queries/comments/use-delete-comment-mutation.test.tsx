import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/comments", () => ({
    deleteCommentAction: vi.fn(async () => undefined),
}));

import { deleteCommentAction } from "@/app/actions/comments";
import { useDeleteCommentMutation } from "@/lib/queries/comments/use-delete-comment-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeleteCommentMutation", () => {
    it("calls deleteCommentAction and invalidates comments + post-detail on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useDeleteCommentMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ commentId: "c1", postId: "p1" });
        });

        expect(deleteCommentAction).toHaveBeenCalledWith("c1", "p1");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.comments.forPost("p1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") });
    });
});
