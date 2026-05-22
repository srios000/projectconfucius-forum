import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/comments", () => ({
    createCommentAction: vi.fn(async () => ({
        id: "c1",
        postId: "p1",
        communityId: "co1",
        text: "hi",
        creatorId: "u1",
        creatorDisplayText: "u",
        parentId: null,
        depth: 0,
        postTitle: "t",
        createdAt: new Date().toISOString(),
        updatedAt: null,
    })),
}));

import { createCommentAction } from "@/app/actions/comments";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreateCommentMutation", () => {
    it("calls createCommentAction and invalidates comments + post detail on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useCreateCommentMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                communityId: "co1",
                postId: "p1",
                postTitle: "t",
                commentText: "hi",
            });
        });

        expect(createCommentAction).toHaveBeenCalledWith("co1", "p1", "t", "hi", undefined);
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.comments.forPost("p1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") });
    });
});