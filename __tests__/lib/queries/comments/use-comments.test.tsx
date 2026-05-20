import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";

vi.mock("@/app/actions/reads", () => ({
    getCommentsAction: vi.fn(async () => [
        { id: "cm1", postId: "p1", text: "hi" },
    ]),
}));

import { getCommentsAction } from "@/app/actions/reads";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

beforeEach(() => vi.clearAllMocks());

describe("useCommentsForPostQuery", () => {
    it("fetches comments for a post id", async () => {
        // Isolated QueryClient instance for the test case
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </QueryClientProvider>
        );

        const { result } = renderHook(
            () => useCommentsForPostQuery({ postId: "p1" }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.data?.[0]?.id).toBe("cm1"));
        expect(getCommentsAction).toHaveBeenCalledWith("p1");
    });
});