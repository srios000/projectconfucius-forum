import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
    createCommunityAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { createCommunityAction } from "@/app/actions/community";
import { useCreateCommunityMutation } from "@/lib/queries/community/use-create-community-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreateCommunityMutation", () => {
    it("calls createCommunityAction and invalidates community.list + snippets", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useCreateCommunityMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityName: "foo", communityType: "public" });
        });

        expect(createCommunityAction).toHaveBeenCalledWith("foo", "public");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") }),
        );
        expect(
            spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
        ).toBe(true);
    });
});