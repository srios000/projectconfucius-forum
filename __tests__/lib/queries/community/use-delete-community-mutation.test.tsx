import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
    deleteCommunityAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { deleteCommunityAction } from "@/app/actions/community";
import { useDeleteCommunityMutation } from "@/lib/queries/community/use-delete-community-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeleteCommunityMutation", () => {
    it("calls deleteCommunityAction and invalidates list + detail + snippets", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useDeleteCommunityMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                communityData: { id: "co1", creatorId: "u1", privacyType: "public", numberOfMembers: 1 } as any,
            });
        });

        expect(deleteCommunityAction).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
        expect(
            spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
        ).toBe(true);
    });
});