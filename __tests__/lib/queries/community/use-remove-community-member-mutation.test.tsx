import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
    removeCommunityMemberAction: vi.fn(async () => undefined),
}));

import { removeCommunityMemberAction } from "@/app/actions/community";
import { useRemoveCommunityMemberMutation } from "@/lib/queries/community/use-remove-community-member-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useRemoveCommunityMemberMutation", () => {
    it("calls removeCommunityMemberAction and invalidates members + removed-user snippets", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useRemoveCommunityMemberMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityId: "co1", memberId: "u2" });
        });

        expect(removeCommunityMemberAction).toHaveBeenCalledWith("co1", "u2");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.members("co1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u2") });
    });
});