import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/upload/uploadImage", () => ({
    uploadImage: vi.fn(async () => ({ imageUrl: "https://cdn/x.jpg" })),
}));

vi.mock("@/app/actions/profile", () => ({
    profileNameAction: vi.fn(async () => ({ userId: "u1" })),
    removeProfileImageAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { uploadImage } from "@/lib/upload/uploadImage";
import { profileNameAction, removeProfileImageAction } from "@/app/actions/profile";
import {
    useUploadProfileImageMutation,
    useRemoveProfileImageMutation,
    useUpdateProfileNameMutation,
} from "@/lib/queries/profile/use-profile-mutations";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useUploadProfileImageMutation", () => {
    it("calls uploadImage and invalidates profile(userId)", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");
        const { result } = renderHook(() => useUploadProfileImageMutation(), { wrapper: wrap(client) });
        const blob = new Blob(["x"], { type: "image/jpeg" });

        await act(async () => {
            await result.current.mutateAsync({ blob });
        });

        expect(uploadImage).toHaveBeenCalledWith("profile-image", blob);
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.profile("u1") }),
        );
    });
});

describe("useRemoveProfileImageMutation", () => {
    it("calls removeProfileImageAction and invalidates profile(userId)", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");
        const { result } = renderHook(() => useRemoveProfileImageMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(removeProfileImageAction).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.profile("u1") }),
        );
    });
});

describe("useUpdateProfileNameMutation", () => {
    it("calls profileNameAction and invalidates profile(userId)", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const spy = vi.spyOn(client, "invalidateQueries");
        const { result } = renderHook(() => useUpdateProfileNameMutation(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.mutateAsync({ name: "Sue" });
        });

        expect(profileNameAction).toHaveBeenCalledWith("Sue");
        await waitFor(() =>
            expect(spy).toHaveBeenCalledWith({ queryKey: keys.profile("u1") }),
        );
    });
});