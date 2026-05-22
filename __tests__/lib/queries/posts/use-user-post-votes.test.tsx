import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    getPostVotesAction: vi.fn(async (ids: string[]) => ids.map((id) => ({ id: `v-${id}`, postId: id, communityId: "c1", voteValue: 1 }))),
}));

import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { getPostVotesAction } from "@/app/actions/posts";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useUserPostVotesQuery", () => {
    it("fetches votes for the given postIds when enabled", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const { result } = renderHook(
            () => useUserPostVotesQuery({ postIds: ["p1", "p2"], enabled: true }),
            { wrapper: wrap(client) },
        );
        await waitFor(() => expect(result.current.data?.length).toBe(2));
        expect(getPostVotesAction).toHaveBeenCalledWith(["p1", "p2"]);
    });

    it("skips fetch when postIds is empty", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => useUserPostVotesQuery({ postIds: [], enabled: true }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostVotesAction).not.toHaveBeenCalled();
    });

    it("skips fetch when enabled=false", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => useUserPostVotesQuery({ postIds: ["p1"], enabled: false }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostVotesAction).not.toHaveBeenCalled();
    });
});
