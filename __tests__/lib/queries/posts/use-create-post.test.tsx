import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    createPostAction: vi.fn(async () => undefined),
}));

import { createPostAction } from "@/app/actions/posts";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreatePostMutation", () => {
    it("calls createPostAction and invalidates the posts.feed.* keys", async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useCreatePostMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                communityId: "c1",
                communityImageUrl: undefined,
                postData: { title: "t", body: "b" },
            });
        });

        expect(createPostAction).toHaveBeenCalledWith(
            { kind: "community", communityId: "c1", communityImageUrl: undefined },
            { title: "t", body: "b" },
            undefined,
        );
        await waitFor(() =>
            expect(
                spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
            ).toBe(true),
        );
    });
});