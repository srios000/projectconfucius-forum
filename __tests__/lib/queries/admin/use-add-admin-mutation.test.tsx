import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/admin", () => ({
    addAdminAction: vi.fn(async () => undefined),
}));

import { addAdminAction } from "@/app/actions/admin";
import { useAddAdminMutation } from "@/lib/queries/admin/use-add-admin-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useAddAdminMutation", () => {
    it("calls addAdminAction and invalidates admins list on success", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");

        const { result } = renderHook(() => useAddAdminMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ communityId: "co1", targetUserId: "u2" });
        });

        expect(addAdminAction).toHaveBeenCalledWith("co1", "u2");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.admins("co1") }),
        );
    });
});
