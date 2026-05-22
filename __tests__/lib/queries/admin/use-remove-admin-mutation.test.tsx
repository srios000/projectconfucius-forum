import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/admin", () => ({
    removeAdminAction: vi.fn(async () => undefined),
}));

import { removeAdminAction } from "@/app/actions/admin";
import { useRemoveAdminMutation } from "@/lib/queries/admin/use-remove-admin-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useRemoveAdminMutation", () => {
    it("calls removeAdminAction and invalidates admins list on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useRemoveAdminMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityId: "co1", targetUserId: "u2" });
        });

        expect(removeAdminAction).toHaveBeenCalledWith("co1", "u2");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.admins("co1") }),
        );
    });
});