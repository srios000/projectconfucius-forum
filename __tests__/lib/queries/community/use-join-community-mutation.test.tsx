import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
    joinCommunityAction: vi.fn(async () => ({
        communityId: "co1",
        isModerator: false,
        imageUrl: undefined,
    })),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { joinCommunityAction } from "@/app/actions/community";
import { useJoinCommunityMutation } from "@/lib/queries/community/use-join-community-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useJoinCommunityMutation", () => {
    it("calls joinCommunityAction and invalidates snippets + detail + members", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useJoinCommunityMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({
                communityData: { id: "co1", creatorId: "u2", imageUrl: undefined } as any,
            });
        });

        expect(joinCommunityAction).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") }),
        );
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") });
        expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.members("co1") });
    });
});