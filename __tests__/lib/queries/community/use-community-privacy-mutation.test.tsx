import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
    updateCommunityPrivacyAction: vi.fn(async () => undefined),
}));

import { updateCommunityPrivacyAction } from "@/app/actions/community";
import { useCommunityPrivacyMutation } from "@/lib/queries/community/use-community-privacy-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCommunityPrivacyMutation", () => {
    it("calls updateCommunityPrivacyAction and invalidates community.detail", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useCommunityPrivacyMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityId: "co1", privacyType: "private" });
        });

        expect(updateCommunityPrivacyAction).toHaveBeenCalledWith("co1", "private");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
        );
    });
});