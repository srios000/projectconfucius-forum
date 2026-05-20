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