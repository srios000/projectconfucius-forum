import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";

vi.mock("@/app/actions/reads", () => ({
    getSearchDataAction: vi.fn(async (q: string) => ({
        communities: [{ id: `c-${q}` }],
        posts: [{ id: `p-${q}` }],
    })),
}));

import { useSearchQuery } from "@/lib/queries/search/use-search";

beforeEach(() => vi.clearAllMocks());

describe("useSearchQuery", () => {
    // Shared wrapper factory to ensure each test case gets a fresh cache
    const createTestWrapper = () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </QueryClientProvider>
        );
    };

    it("returns results for a non-empty term", async () => {
        const { result } = renderHook(
            () => useSearchQuery({ term: "react" }),
            { wrapper: createTestWrapper() },
        );
        await waitFor(() =>
            expect(result.current.data?.communities?.[0]?.id).toBe("c-react"),
        );
    });

    it("is disabled for empty term", async () => {
        const { result } = renderHook(
            () => useSearchQuery({ term: "   " }),
            { wrapper: createTestWrapper() },
        );
        // disabled queries stay in idle/loading-false state
        expect(result.current.fetchStatus).toBe("idle");
    });
});