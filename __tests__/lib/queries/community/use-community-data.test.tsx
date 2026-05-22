import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";

vi.mock("@/app/actions/reads", () => ({
    getCommunityDataAction: vi.fn(async () => ({
        id: "c1",
        displayName: "Test",
    })),
}));

import { getCommunityDataAction } from "@/app/actions/reads";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

beforeEach(() => vi.clearAllMocks());

describe("useCommunityDataQuery", () => {
    it("returns community data for the id", async () => {
        // Create an isolated QueryClient for this test run
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        // A pure React component providing the necessary context
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </QueryClientProvider>
        );

        const { result } = renderHook(
            // Make sure the argument matches what your hook expects (e.g., id vs communityId)
            () => useCommunityDataQuery({ communityId: "c1" }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.data?.id).toBe("c1"));
        expect(getCommunityDataAction).toHaveBeenCalledWith("c1");
    });
});