import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const paramsValue: { communityId?: string } = { communityId: undefined };
vi.mock("next/navigation", () => ({ useParams: () => paramsValue }));

vi.mock("@/app/actions/reads", () => ({
    getCommunityDataAction: vi.fn(async (id: string) => ({ id, displayName: `c-${id}`, privacyType: "public" })),
}));

import { useActiveCommunity } from "@/hooks/community/useActiveCommunity";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe("useActiveCommunity", () => {
    it("returns undefined community when route has no communityId", async () => {
        paramsValue.communityId = undefined;
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const { result } = renderHook(() => useActiveCommunity(), { wrapper: wrap(client) });
        expect(result.current.communityId).toBeUndefined();
        expect(result.current.community).toBeUndefined();
    });

    it("returns community data when route has a communityId", async () => {
        paramsValue.communityId = "c42";
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const { result } = renderHook(() => useActiveCommunity(), { wrapper: wrap(client) });
        await waitFor(() => expect(result.current.community?.id).toBe("c42"));
        expect(result.current.communityId).toBe("c42");
    });
});