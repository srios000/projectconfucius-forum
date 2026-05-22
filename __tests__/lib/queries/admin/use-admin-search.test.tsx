import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";

vi.mock("@/app/actions/reads", () => ({
    searchUsersByEmailAction: vi.fn(async (q: string) => [
        { id: "u1", email: `${q}@x.com` },
    ]),
    findUserByEmailAction: vi.fn(async (e: string) => ({ id: "u2", email: e })),
}));

import { useAdminSearchUsersQuery } from "@/lib/queries/admin/use-admin-search";

beforeEach(() => vi.clearAllMocks());

describe("useAdminSearchUsersQuery", () => {
    it("returns matches for a non-empty query", async () => {
        // Isolated instance prevents cache collisions across separate test executions
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </QueryClientProvider>
        );

        const { result } = renderHook(
            () => useAdminSearchUsersQuery({ query: "alice" }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.data?.[0]?.email).toBe("alice@x.com"));
    });
});