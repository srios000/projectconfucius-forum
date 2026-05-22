import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushSpy }) }));

import usePostSelection from "@/hooks/posts/usePostSelection";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => { pushSpy.mockClear(); });

describe("usePostSelection", () => {
    it("seeds keys.posts.detail and pushes to the post route", () => {
        const client = new QueryClient();
        const { result } = renderHook(() => usePostSelection(), { wrapper: wrap(client) });
        const post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        act(() => { result.current.onSelectPost(post); });
        expect(client.getQueryData<Post>(keys.posts.detail("p1"))).toEqual(post);
        expect(pushSpy).toHaveBeenCalledWith("/c/c1/posts/p1");
    });
});