import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";

// Mock the action
vi.mock("@/app/actions/reads", () => ({
    getPostsAction: vi.fn(async () => ({
        posts: [{ id: "p1", title: "hello" }],
        newLastVisible: { id: "p1" },
    })),
}));

import { getPostsAction } from "@/app/actions/reads";
import { usePostsFeedQuery } from "@/lib/queries/posts/use-posts-feed";
import { keys } from "@/lib/queries/keys";

beforeEach(() => vi.clearAllMocks());

describe("usePostsFeedQuery", () => {
    it("fetches the first page and exposes it under the feed key", async () => {
        // Keep retry: false to prevent tests from hanging on failure
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        // 1. Return pure JSX, not a DOM element
        // 2. Add <Suspense> to catch the hook's loading state and prevent `act` warnings
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </QueryClientProvider>
        );

        const { result } = renderHook(
            () =>
                usePostsFeedQuery({
                    scope: { communityId: "c1" },
                    cursor: null,
                }),
            { wrapper }
        );

        // Wait for the query to resolve
        await waitFor(() => expect(result.current.data?.posts?.[0]?.id).toBe("p1"));

        expect(getPostsAction).toHaveBeenCalledWith("c1", undefined, undefined, null);
        expect(
            client.getQueryData(
                keys.posts.feed({ scope: { communityId: "c1" }, cursor: null })
            )
        ).toBeDefined();
    });
});