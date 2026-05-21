# Forum local-state mirror elimination — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every `useEffect` that mirrors TanStack-Query-owned server state into local React state or jotai atoms. Migrate the posts feed to `useInfiniteQuery`, move vote/delete optimistic UI into mutation `onMutate`/`onError`, delete `uiAtom.selectedPost` and `uiAtom.currentCommunity` entirely, replace them with route-derived TanStack queries.

**Architecture:** Six commits, sequenced so that each is independently green (`pnpm test && pnpm typecheck && pnpm eslint && pnpm build`). Phase 1 adds primitives with tests but no consumer wiring. Phase 2 wires the optimistic mutation flow against the new infinite feed key. Phase 3 cuts the three feed consumers over to the new query and shrinks `usePostVote` / `usePostDeletion` to no-arg shells. Phases 4–5 delete the two atom mirrors. Phase 6 mops up the original lint warnings.

**Tech Stack:** TanStack Query v5 (`useInfiniteQuery`, `useMutation` with `onMutate`/`onError`, `setQueryData`, `cancelQueries`), Next.js 16 App Router (`useParams`), jotai (shrinking, not expanding), Vitest + happy-dom + Testing Library. Tests reuse [`__tests__/helpers/renderWithProviders.tsx`](../../../__tests__/helpers/renderWithProviders.tsx) and the per-test `QueryClient` pattern in [`__tests__/lib/queries/posts/use-post-vote.test.tsx`](../../../__tests__/lib/queries/posts/use-post-vote.test.tsx).

**Spec reference:** [`docs/superpowers/specs/2026-05-21-forum-local-state-mirror-elimination-design.md`](../specs/2026-05-21-forum-local-state-mirror-elimination-design.md).

---

## File structure

**New files:**
- `lib/queries/posts/optimistic-helpers.ts` — `computeVoteDelta`, `mapInfiniteFeedPost`, `removeFromInfiniteFeed` pure helpers (shared by mutation `onMutate` paths).
- `lib/queries/posts/use-posts-infinite.ts` — `usePostsInfiniteQuery` primitive.
- `lib/queries/posts/use-user-post-votes.ts` — `useUserPostVotesQuery` for the "votes-for-N-postIds" case (HomePage feed, where votes are not scoped to one community).
- `hooks/community/useActiveCommunity.ts` — route-derived active community hook.
- Test files mirroring each of the above under `__tests__/lib/queries/posts/` and `__tests__/hooks/community/`.

**Modified files:**
- `lib/queries/keys.ts` — add `posts.infiniteFeed`, delete `posts.feed` at the end of commit 3.
- `lib/queries/posts/use-post-vote.ts` — add `onMutate`/`onError`/context.
- `lib/queries/posts/use-delete-post.ts` — add `onMutate`/`onError`/context.
- `hooks/posts/usePostVote.tsx` — trim to no-arg shell (permission gate + toast + `mutate`).
- `hooks/posts/usePostDeletion.ts` — trim to no-arg shell.
- `hooks/posts/usePostVoteSync.ts` — drop `setPostVotes` from return.
- `hooks/posts/usePostSelection.ts` — `setQueryData` prefetch instead of atom write.
- `hooks/community/useCommunityState.ts` — trim to snippets-only (delete `currentCommunity` path and `setCommunityStateValue`).
- `hooks/comments/useCreateComment.ts` — `setQueryData` count bump instead of atom write.
- `hooks/comments/useDeleteComment.ts` — `setQueryData` count decrement instead of atom write.
- `atoms/uiAtom.ts` — remove `selectedPost` and `currentCommunity` fields.
- `app/HomePageClient.tsx`, `components/posts/Posts.tsx`, `app/community/[communityId]/comments/[pid]/PostClientPage.tsx` — consume `useInfiniteQuery`; no local `posts` state; no mirror effects.
- `app/community/[communityId]/comments/CommunityClientPage.tsx`, `app/community/[communityId]/submit/SubmitPostClientPage.tsx`, `components/posts/comments/Comments.tsx`, `components/navbar/right-content/Icons.tsx`, `components/community/CreatePostLink.tsx`, `components/community/community-header/CommunityHeader.tsx`, `components/community/recommendations/Recommendations.tsx`, `components/community/about/About.tsx`, `app/communities/page.tsx` — migrate from `useCommunityState` reads to `useActiveCommunity` / `useCommunityDataQuery` / direct prop pass-through.

**Deleted files:**
- `hooks/posts/usePostsFeed.ts` (commit 3).
- `hooks/posts/usePostState.ts` (commit 4).

---

## Commit 1 — Add primitives with tests, no consumer wiring

### Task 1.1: `optimistic-helpers.ts` — `computeVoteDelta`

**Files:**
- Create: `lib/queries/posts/optimistic-helpers.ts`
- Test: `__tests__/lib/queries/posts/optimistic-helpers.test.ts`

- [x] **Step 1: Write the failing test**

```ts
// __tests__/lib/queries/posts/optimistic-helpers.test.ts
import { describe, it, expect } from "vitest";
import { computeVoteDelta } from "@/lib/queries/posts/optimistic-helpers";
import type { PostVote } from "@/types/post";

describe("computeVoteDelta", () => {
    it("no existing vote: returns vote value as delta and creates new vote", () => {
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing: undefined });
        expect(r.delta).toBe(1);
        expect(r.nextVote?.voteValue).toBe(1);
        expect(r.nextVote?.postId).toBe("p1");
        expect(r.deletedVoteId).toBeUndefined();
    });

    it("existing vote same direction: returns negated delta and marks for deletion", () => {
        const existing: PostVote = { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 };
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing });
        expect(r.delta).toBe(-1);
        expect(r.deletedVoteId).toBe("v1");
        expect(r.nextVote).toBeUndefined();
    });

    it("existing vote opposite direction: returns 2x delta and flips vote", () => {
        const existing: PostVote = { id: "v1", postId: "p1", communityId: "c1", voteValue: -1 };
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing });
        expect(r.delta).toBe(2);
        expect(r.nextVote?.id).toBe("v1");
        expect(r.nextVote?.voteValue).toBe(1);
        expect(r.deletedVoteId).toBeUndefined();
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/posts/optimistic-helpers.test.ts`
Expected: FAIL with "Cannot find module '@/lib/queries/posts/optimistic-helpers'".

- [x] **Step 3: Write minimal implementation**

```ts
// lib/queries/posts/optimistic-helpers.ts
import type { Post, PostVote } from "@/types/post";

export type VoteDeltaArgs = {
    vote: number;
    postId: string;
    communityId: string;
    existing?: PostVote;
};

export type VoteDeltaResult = {
    delta: number;
    nextVote?: PostVote;
    deletedVoteId?: string;
};

export function computeVoteDelta({ vote, postId, communityId, existing }: VoteDeltaArgs): VoteDeltaResult {
    if (!existing) {
        return {
            delta: vote,
            nextVote: {
                id: `optimistic-${postId}-${Date.now()}`,
                postId,
                communityId,
                voteValue: vote,
            },
        };
    }
    if (existing.voteValue === vote) {
        return { delta: -vote, deletedVoteId: existing.id };
    }
    return { delta: 2 * vote, nextVote: { ...existing, voteValue: vote } };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/lib/queries/posts/optimistic-helpers.test.ts`
Expected: PASS (3/3).

- [x] **Step 5: Commit (after Tasks 1.2–1.4 also pass; commit at end of Commit 1)**

### Task 1.2: `optimistic-helpers.ts` — `mapInfiniteFeedPost` and `removeFromInfiniteFeed`

**Files:**
- Modify: `lib/queries/posts/optimistic-helpers.ts`
- Modify: `__tests__/lib/queries/posts/optimistic-helpers.test.ts`

- [x] **Step 1: Write the failing tests (append to existing test file)**

```ts
import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "@/types/post";
import { mapInfiniteFeedPost, removeFromInfiniteFeed } from "@/lib/queries/posts/optimistic-helpers";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

const p = (id: string, voteStatus = 0): Post =>
    ({ id, communityId: "c1", title: id, voteStatus } as Post);

describe("mapInfiniteFeedPost", () => {
    it("returns undefined when input data is undefined", () => {
        expect(mapInfiniteFeedPost<FeedPage>(undefined, "p1", (post) => post)).toBeUndefined();
    });

    it("maps matching post across all pages, leaves non-matches", () => {
        const data: InfiniteData<FeedPage> = {
            pages: [
                { posts: [p("p1", 1), p("p2", 0)], newLastVisible: null },
                { posts: [p("p3", 0), p("p1", 1)], newLastVisible: null },
            ],
            pageParams: [null, null],
        };
        const out = mapInfiniteFeedPost(data, "p1", (post) => ({ ...post, voteStatus: post.voteStatus + 5 }));
        expect(out!.pages[0].posts[0].voteStatus).toBe(6);
        expect(out!.pages[0].posts[1].voteStatus).toBe(0);
        expect(out!.pages[1].posts[0].voteStatus).toBe(0);
        expect(out!.pages[1].posts[1].voteStatus).toBe(6);
    });
});

describe("removeFromInfiniteFeed", () => {
    it("returns undefined when input data is undefined", () => {
        expect(removeFromInfiniteFeed<FeedPage>(undefined, "p1")).toBeUndefined();
    });

    it("drops the matching post from every page", () => {
        const data: InfiniteData<FeedPage> = {
            pages: [
                { posts: [p("p1"), p("p2")], newLastVisible: null },
                { posts: [p("p3"), p("p1")], newLastVisible: null },
            ],
            pageParams: [null, null],
        };
        const out = removeFromInfiniteFeed(data, "p1");
        expect(out!.pages[0].posts.map((x) => x.id)).toEqual(["p2"]);
        expect(out!.pages[1].posts.map((x) => x.id)).toEqual(["p3"]);
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/posts/optimistic-helpers.test.ts`
Expected: FAIL with "mapInfiniteFeedPost is not a function" (or import error).

- [x] **Step 3: Append implementation**

```ts
// append to lib/queries/posts/optimistic-helpers.ts
import type { InfiniteData } from "@tanstack/react-query";

type FeedPageLike<P> = { posts: P[]; newLastVisible: unknown };

export function mapInfiniteFeedPost<TPage extends FeedPageLike<any>>(
    data: InfiniteData<TPage> | undefined,
    postId: string,
    mapper: (post: TPage["posts"][number]) => TPage["posts"][number],
): InfiniteData<TPage> | undefined {
    if (!data) return undefined;
    return {
        ...data,
        pages: data.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => (post.id === postId ? mapper(post) : post)),
        })),
    };
}

export function removeFromInfiniteFeed<TPage extends FeedPageLike<any>>(
    data: InfiniteData<TPage> | undefined,
    postId: string,
): InfiniteData<TPage> | undefined {
    if (!data) return undefined;
    return {
        ...data,
        pages: data.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((post) => post.id !== postId),
        })),
    };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/lib/queries/posts/optimistic-helpers.test.ts`
Expected: PASS (7/7 cumulative).

### Task 1.3: `keys.posts.infiniteFeed` factory

**Files:**
- Modify: `lib/queries/keys.ts`
- Test: `__tests__/lib/queries/keys.test.ts`

- [x] **Step 1: Write the failing test (append)**

```ts
// __tests__/lib/queries/keys.test.ts (append)
import { keys } from "@/lib/queries/keys";

describe("keys.posts.infiniteFeed", () => {
    it("returns ['posts','feed', scope] and matches feed predicate", () => {
        const k = keys.posts.infiniteFeed({ communityId: "c1" });
        expect(k[0]).toBe("posts");
        expect(k[1]).toBe("feed");
        expect(k[2]).toEqual({ communityId: "c1" });
    });

    it("two calls with the same scope shape produce equal keys", () => {
        const a = keys.posts.infiniteFeed({ communityIds: ["c1", "c2"] });
        const b = keys.posts.infiniteFeed({ communityIds: ["c1", "c2"] });
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/keys.test.ts`
Expected: FAIL with "keys.posts.infiniteFeed is not a function".

- [x] **Step 3: Add factory to `lib/queries/keys.ts`**

```ts
// inside the `posts` block in lib/queries/keys.ts, alongside `feed`:
infiniteFeed: (scope: FeedScope) => ["posts", "feed", scope] as const,
```

`keys.posts.feed` stays for now (deleted in Commit 3 after consumers move).

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/lib/queries/keys.test.ts`
Expected: PASS.

### Task 1.4: `usePostsInfiniteQuery` primitive

**Files:**
- Create: `lib/queries/posts/use-posts-infinite.ts`
- Test: `__tests__/lib/queries/posts/use-posts-infinite.test.tsx`

- [x] **Step 1: Write the failing test**

```tsx
// __tests__/lib/queries/posts/use-posts-infinite.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/reads", () => ({
    getPostsAction: vi.fn(),
}));

import { getPostsAction } from "@/app/actions/reads";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostsInfiniteQuery", () => {
    it("loads page 1, then fetchNextPage appends page 2 with its cursor", async () => {
        (getPostsAction as any)
            .mockResolvedValueOnce({ posts: [{ id: "p1", communityId: "c1", title: "1", voteStatus: 0 }], newLastVisible: "cursor1" })
            .mockResolvedValueOnce({ posts: [{ id: "p2", communityId: "c1", title: "2", voteStatus: 0 }], newLastVisible: null });

        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const { result } = renderHook(
            () => usePostsInfiniteQuery({ scope: { communityId: "c1" } }),
            { wrapper: wrap(client) },
        );

        await waitFor(() => expect(result.current.data?.pages.length).toBe(1));
        expect(result.current.hasNextPage).toBe(true);
        expect(getPostsAction).toHaveBeenLastCalledWith("c1", undefined, undefined, null);

        await act(async () => { await result.current.fetchNextPage(); });

        await waitFor(() => expect(result.current.data?.pages.length).toBe(2));
        expect(result.current.hasNextPage).toBe(false);
        expect(getPostsAction).toHaveBeenLastCalledWith("c1", undefined, undefined, "cursor1");
    });

    it("respects enabled=false (does not call action)", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => usePostsInfiniteQuery({ scope: { communityId: "c1" }, enabled: false }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostsAction).not.toHaveBeenCalled();
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/posts/use-posts-infinite.test.tsx`
Expected: FAIL with import error.

- [x] **Step 3: Implement the primitive**

```ts
// lib/queries/posts/use-posts-infinite.ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { PostCursor } from "@/lib/posts/getPosts";
import type { Post } from "@/types/post";

export type PostsFeedScope = {
    communityId?: string;
    communityIds?: string[];
    isGenericHome?: boolean;
};

export type FeedPage = { posts: Post[]; newLastVisible: PostCursor };

export function usePostsInfiniteQuery({
    scope,
    enabled = true,
}: {
    scope: PostsFeedScope;
    enabled?: boolean;
}) {
    return useInfiniteQuery<FeedPage, Error, { pages: FeedPage[]; pageParams: PostCursor[] }, ReturnType<typeof keys.posts.infiniteFeed>, PostCursor>({
        queryKey: keys.posts.infiniteFeed(scope),
        initialPageParam: null,
        queryFn: ({ pageParam }) =>
            getPostsAction(scope.communityId, scope.communityIds, scope.isGenericHome, pageParam) as Promise<FeedPage>,
        getNextPageParam: (last) => (last.newLastVisible ?? undefined) as PostCursor | undefined,
        enabled,
        staleTime: 0,
    });
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/lib/queries/posts/use-posts-infinite.test.tsx`
Expected: PASS (2/2).

### Task 1.5: `useUserPostVotesQuery` primitive

**Files:**
- Create: `lib/queries/posts/use-user-post-votes.ts`
- Modify: `lib/queries/keys.ts` (add `posts.userVotes`)
- Test: `__tests__/lib/queries/posts/use-user-post-votes.test.tsx`

- [x] **Step 1: Add the key factory**

```ts
// inside `posts` block in lib/queries/keys.ts, alongside the others:
userVotes: (postIds: string[]) => ["posts", "user-votes", [...postIds].sort().join(",")] as const,
```

- [x] **Step 2: Write the failing test**

```tsx
// __tests__/lib/queries/posts/use-user-post-votes.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
    getPostVotesAction: vi.fn(async (ids: string[]) => ids.map((id) => ({ id: `v-${id}`, postId: id, communityId: "c1", voteValue: 1 }))),
}));

import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { getPostVotesAction } from "@/app/actions/posts";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useUserPostVotesQuery", () => {
    it("fetches votes for the given postIds when enabled", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const { result } = renderHook(
            () => useUserPostVotesQuery({ postIds: ["p1", "p2"], enabled: true }),
            { wrapper: wrap(client) },
        );
        await waitFor(() => expect(result.current.data?.length).toBe(2));
        expect(getPostVotesAction).toHaveBeenCalledWith(["p1", "p2"]);
    });

    it("skips fetch when postIds is empty", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => useUserPostVotesQuery({ postIds: [], enabled: true }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostVotesAction).not.toHaveBeenCalled();
    });

    it("skips fetch when enabled=false", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        renderHook(
            () => useUserPostVotesQuery({ postIds: ["p1"], enabled: false }),
            { wrapper: wrap(client) },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(getPostVotesAction).not.toHaveBeenCalled();
    });
});
```

- [x] **Step 3: Implement the primitive**

```ts
// lib/queries/posts/use-user-post-votes.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostVotesAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { PostVote } from "@/types/post";

export function useUserPostVotesQuery({
    postIds,
    enabled = true,
}: {
    postIds: string[];
    enabled?: boolean;
}) {
    return useQuery<PostVote[]>({
        queryKey: keys.posts.userVotes(postIds),
        queryFn: () => getPostVotesAction(postIds) as Promise<PostVote[]>,
        enabled: enabled && postIds.length > 0,
    });
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm test __tests__/lib/queries/posts/use-user-post-votes.test.tsx __tests__/lib/queries/keys.test.ts`
Expected: PASS.

### Task 1.6: Commit primitives

- [x] **Step 1: Verify green gate for primitives**

Run: `pnpm test && pnpm typecheck && pnpm eslint`
Expected: all green. (No `pnpm build` needed yet — no consumer wiring.)

- [x] **Step 2: Commit**

```bash
git add lib/queries/posts/optimistic-helpers.ts \
        lib/queries/posts/use-posts-infinite.ts \
        lib/queries/posts/use-user-post-votes.ts \
        lib/queries/keys.ts \
        __tests__/lib/queries/posts/optimistic-helpers.test.ts \
        __tests__/lib/queries/posts/use-posts-infinite.test.tsx \
        __tests__/lib/queries/posts/use-user-post-votes.test.tsx \
        __tests__/lib/queries/keys.test.ts
git commit -m "feat(forum): add infinite feed + user-votes + optimistic helpers primitives

Adds usePostsInfiniteQuery, useUserPostVotesQuery, and pure
computeVoteDelta/mapInfiniteFeedPost/removeFromInfiniteFeed helpers.
No consumer wiring yet; existing usePostsFeed and keys.posts.feed
remain. Sets up the optimistic mutation refactor in the next commit."
```

---

## Commit 2 — Wire optimistic UI into vote + delete mutations

### Task 2.1: `usePostVoteMutation` — optimistic `onMutate`/`onError`

**Files:**
- Modify: `lib/queries/posts/use-post-vote.ts`
- Modify: `__tests__/lib/queries/posts/use-post-vote.test.tsx`

- [x] **Step 1: Write the failing optimistic test (append)**

```tsx
// __tests__/lib/queries/posts/use-post-vote.test.tsx (append)
import type { InfiniteData } from "@tanstack/react-query";
import type { Post, PostVote } from "@/types/post";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

describe("usePostVoteMutation — optimistic", () => {
    it("optimistically updates detail + votes + infinite feed before the action resolves", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);
        client.setQueryData<PostVote[]>(keys.posts.votes("c1"), []);
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [post], newLastVisible: null }],
            pageParams: [null],
        });

        // Make the action hang so we can observe the optimistic state mid-flight.
        let resolveAction: (v: any) => void = () => {};
        (voteAction as any).mockImplementationOnce(
            () => new Promise((res) => { resolveAction = res; }),
        );

        const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

        act(() => {
            result.current.mutate({ post, vote: 1, communityId: "c1" });
        });

        // Optimistic state visible before action resolves
        await waitFor(() => {
            const d = client.getQueryData<Post>(keys.posts.detail("p1"));
            expect(d?.voteStatus).toBe(1);
        });
        const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
        expect(feed!.pages[0].posts[0].voteStatus).toBe(1);
        const votes = client.getQueryData<PostVote[]>(keys.posts.votes("c1"));
        expect(votes!.length).toBe(1);
        expect(votes![0].voteValue).toBe(1);

        resolveAction({ voteChange: 1, newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 }, voteIdToDelete: null });
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("rolls back detail + votes + infinite feed on error", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);
        client.setQueryData<PostVote[]>(keys.posts.votes("c1"), []);
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [post], newLastVisible: null }],
            pageParams: [null],
        });

        (voteAction as any).mockRejectedValueOnce(new Error("server down"));

        const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

        await act(async () => {
            try { await result.current.mutateAsync({ post, vote: 1, communityId: "c1" }); } catch {}
        });

        expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.voteStatus).toBe(0);
        expect(client.getQueryData<PostVote[]>(keys.posts.votes("c1"))).toEqual([]);
        expect(client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }))!.pages[0].posts[0].voteStatus).toBe(0);
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/posts/use-post-vote.test.tsx`
Expected: FAIL — optimistic detail not updated mid-flight; rollback assertion fails.

- [x] **Step 3: Rewrite `lib/queries/posts/use-post-vote.ts`**

```ts
"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { voteAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post, PostVote } from "@/types/post";
import {
    computeVoteDelta,
    mapInfiniteFeedPost,
    type VoteDeltaResult,
} from "@/lib/queries/posts/optimistic-helpers";
import type { FeedPage } from "@/lib/queries/posts/use-posts-infinite";

export type PostVoteArgs = {
    post: Post;
    vote: number;
    communityId: string;
    existing?: PostVote;
};

type Ctx = {
    prevDetail: Post | undefined;
    prevVotes: PostVote[];
    prevFeeds: [readonly unknown[], InfiniteData<FeedPage> | undefined][];
};

const feedPredicate = (q: { queryKey: readonly unknown[] }) =>
    q.queryKey[0] === "posts" && q.queryKey[1] === "feed";

export function usePostVoteMutation() {
    const qc = useQueryClient();
    return useMutation<unknown, Error, PostVoteArgs, Ctx>({
        mutationKey: ["posts", "vote"],
        mutationFn: ({ post, vote, communityId, existing }) =>
            voteAction(post, vote, communityId, existing),
        onMutate: async (vars) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.posts.detail(vars.post.id!) }),
                qc.cancelQueries({ queryKey: keys.posts.votes(vars.communityId) }),
                qc.cancelQueries({ predicate: feedPredicate }),
            ]);

            const prevDetail = qc.getQueryData<Post>(keys.posts.detail(vars.post.id!));
            const prevVotes = qc.getQueryData<PostVote[]>(keys.posts.votes(vars.communityId)) ?? [];
            const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedPredicate });

            const existing = vars.existing ?? prevVotes.find((v) => v.postId === vars.post.id);
            const { delta, nextVote, deletedVoteId }: VoteDeltaResult = computeVoteDelta({
                vote: vars.vote,
                postId: vars.post.id!,
                communityId: vars.communityId,
                existing,
            });

            const optimisticPost: Post = { ...(prevDetail ?? vars.post), voteStatus: (prevDetail ?? vars.post).voteStatus + delta };

            qc.setQueryData<Post>(keys.posts.detail(vars.post.id!), optimisticPost);

            qc.setQueryData<PostVote[]>(keys.posts.votes(vars.communityId), (old = []) => {
                let next = [...old];
                if (deletedVoteId) {
                    next = next.filter((v) => v.id !== deletedVoteId);
                } else if (nextVote) {
                    const idx = next.findIndex((v) => v.postId === vars.post.id);
                    if (idx >= 0) next[idx] = nextVote;
                    else next.push(nextVote);
                }
                return next;
            });

            prevFeeds.forEach(([key]) => {
                qc.setQueryData<InfiniteData<FeedPage>>(key, (old) =>
                    mapInfiniteFeedPost<FeedPage>(old, vars.post.id!, (p) => ({ ...p, voteStatus: p.voteStatus + delta })),
                );
            });

            return { prevDetail, prevVotes, prevFeeds };
        },
        onError: (_err, vars, ctx) => {
            if (!ctx) return;
            qc.setQueryData(keys.posts.detail(vars.post.id!), ctx.prevDetail);
            qc.setQueryData(keys.posts.votes(vars.communityId), ctx.prevVotes);
            ctx.prevFeeds.forEach(([key, data]) => qc.setQueryData(key, data));
        },
        onSettled: (_data, _err, vars) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.post.id!) });
            void qc.invalidateQueries({ queryKey: keys.posts.votes(vars.communityId) });
            void qc.invalidateQueries({ predicate: feedPredicate });
        },
    });
}
```

- [x] **Step 4: Run all post-vote tests**

Run: `pnpm test __tests__/lib/queries/posts/use-post-vote.test.tsx`
Expected: PASS (3/3 — original invalidation test plus 2 new optimistic tests).

### Task 2.2: `useDeletePostMutation` — optimistic `onMutate`/`onError`

**Files:**
- Modify: `lib/queries/posts/use-delete-post.ts`
- Modify: `__tests__/lib/queries/posts/use-delete-post.test.tsx`

- [x] **Step 1: Write the failing optimistic test (append)**

```tsx
// __tests__/lib/queries/posts/use-delete-post.test.tsx (append)
import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "@/types/post";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

describe("useDeletePostMutation — optimistic", () => {
    it("optimistically removes the post from every feed page", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const p1 = { id: "p1", communityId: "c1", title: "1", voteStatus: 0 } as Post;
        const p2 = { id: "p2", communityId: "c1", title: "2", voteStatus: 0 } as Post;
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1, p2], newLastVisible: null }],
            pageParams: [null],
        });

        let resolveAction: (v: any) => void = () => {};
        (deletePostAction as any).mockImplementationOnce(
            () => new Promise((res) => { resolveAction = res; }),
        );

        const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });
        act(() => { result.current.mutate({ postId: "p1" }); });

        await waitFor(() => {
            const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
            expect(feed!.pages[0].posts.map((p) => p.id)).toEqual(["p2"]);
        });

        resolveAction(undefined);
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("rolls back the feed on error", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
        const p1 = { id: "p1", communityId: "c1", title: "1", voteStatus: 0 } as Post;
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1], newLastVisible: null }],
            pageParams: [null],
        });

        (deletePostAction as any).mockRejectedValueOnce(new Error("nope"));

        const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });
        await act(async () => {
            try { await result.current.mutateAsync({ postId: "p1" }); } catch {}
        });

        const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
        expect(feed!.pages[0].posts.map((p) => p.id)).toEqual(["p1"]);
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/lib/queries/posts/use-delete-post.test.tsx`
Expected: FAIL — optimistic removal and rollback both fail.

- [x] **Step 3: Rewrite `lib/queries/posts/use-delete-post.ts`**

```ts
"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePostAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post } from "@/types/post";
import { removeFromInfiniteFeed } from "@/lib/queries/posts/optimistic-helpers";
import type { FeedPage } from "@/lib/queries/posts/use-posts-infinite";

export type DeletePostArgs = { postId: string };

type Ctx = {
    prevDetail: Post | undefined;
    prevFeeds: [readonly unknown[], InfiniteData<FeedPage> | undefined][];
};

const feedPredicate = (q: { queryKey: readonly unknown[] }) =>
    q.queryKey[0] === "posts" && q.queryKey[1] === "feed";

export function useDeletePostMutation() {
    const qc = useQueryClient();
    return useMutation<unknown, Error, DeletePostArgs, Ctx>({
        mutationKey: ["posts", "delete"],
        mutationFn: ({ postId }) => deletePostAction(postId),
        onMutate: async ({ postId }) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.posts.detail(postId) }),
                qc.cancelQueries({ predicate: feedPredicate }),
            ]);
            const prevDetail = qc.getQueryData<Post>(keys.posts.detail(postId));
            const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedPredicate });
            qc.setQueryData(keys.posts.detail(postId), undefined);
            prevFeeds.forEach(([key]) => {
                qc.setQueryData<InfiniteData<FeedPage>>(key, (old) => removeFromInfiniteFeed<FeedPage>(old, postId));
            });
            return { prevDetail, prevFeeds };
        },
        onError: (_err, { postId }, ctx) => {
            if (!ctx) return;
            qc.setQueryData(keys.posts.detail(postId), ctx.prevDetail);
            ctx.prevFeeds.forEach(([key, data]) => qc.setQueryData(key, data));
        },
        onSettled: (_data, _err, { postId }) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(postId) });
            void qc.invalidateQueries({ predicate: feedPredicate });
        },
    });
}
```

- [x] **Step 4: Run all delete-post tests**

Run: `pnpm test __tests__/lib/queries/posts/use-delete-post.test.tsx`
Expected: PASS (3/3).

### Task 2.3: Commit optimistic mutations

- [x] **Step 1: Verify green gate**

Run: `pnpm test && pnpm typecheck && pnpm eslint && pnpm build`
Expected: all green. (Build matters now — mutations are wired even though consumers haven't migrated yet.)

- [x] **Step 2: Commit**

```bash
git add lib/queries/posts/use-post-vote.ts \
        lib/queries/posts/use-delete-post.ts \
        __tests__/lib/queries/posts/use-post-vote.test.tsx \
        __tests__/lib/queries/posts/use-delete-post.test.tsx
git commit -m "feat(forum): optimistic UI for vote + delete via onMutate/onError

Mutations now own the optimistic flow against keys.posts.detail,
keys.posts.votes, and keys.posts.infiniteFeed via setQueryData with
snapshot/rollback. Existing usePostVote/usePostDeletion shells still
own the duplicated optimistic for now (deleted in the next commit
when consumers cut over)."
```

---

## Commit 3 — Migrate feed consumers and trim vote/delete hook shells

### Task 3.1: Trim `usePostVote` to a no-arg shell

**Files:**
- Modify: `hooks/posts/usePostVote.tsx`
- Test: `__tests__/hooks/posts/usePostVote.test.tsx` (new)

- [x] **Step 1: Write the failing test**

```tsx
// __tests__/hooks/posts/usePostVote.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/app/actions/posts", () => ({
    voteAction: vi.fn(async () => ({ voteChange: 1, newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 }, voteIdToDelete: null })),
    getPostVotesAction: vi.fn(),
    getCommunityPostVotesAction: vi.fn(async () => []),
}));
vi.mock("@/app/actions/reads", () => ({
    getCommunityDataAction: vi.fn(async () => ({ id: "c1", privacyType: "public" })),
}));
vi.mock("@/lib/auth-client", () => ({
    useSession: () => ({ data: { user: { id: "u1", email: "u@x" } } }),
}));

import usePostVote from "@/hooks/posts/usePostVote";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostVote (shell)", () => {
    it("invokes mutation and updates keys.posts.detail optimistically", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        const { result } = renderHook(() => usePostVote(), { wrapper: wrap(client) });

        await act(async () => {
            await result.current.onVote({ stopPropagation: () => {} } as any, post, 1, "c1");
        });

        await waitFor(() => expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.voteStatus).toBe(1));
    });

    it("isVotePending(postId) reflects in-flight vote", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        let resolveAction: (v: any) => void = () => {};
        const { voteAction } = await import("@/app/actions/posts");
        (voteAction as any).mockImplementationOnce(() => new Promise((res) => { resolveAction = res; }));

        const { result } = renderHook(() => usePostVote(), { wrapper: wrap(client) });

        act(() => { void result.current.onVote({ stopPropagation: () => {} } as any, post, 1, "c1"); });

        await waitFor(() => expect(result.current.isVotePending("p1")).toBe(true));
        resolveAction({ voteChange: 1, newVote: null, voteIdToDelete: null });
        await waitFor(() => expect(result.current.isVotePending("p1")).toBe(false));
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/hooks/posts/usePostVote.test.tsx`
Expected: FAIL — current `usePostVote` requires `{posts, setPosts, postVotes, setPostVotes}` args; calling with no args will throw at destructure.

- [x] **Step 3: Rewrite `hooks/posts/usePostVote.tsx`**

```tsx
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import { useMutationState } from "@tanstack/react-query";

const usePostVote = () => {
    const { data: session } = useSession();
    const user = session?.user ?? null;
    const showToast = useCustomToast();
    const { communityStateValue } = useCommunityState();
    const voteMutation = usePostVoteMutation();

    const pendingVars = useMutationState<{ postId: string }>({
        filters: { mutationKey: ["posts", "vote"], status: "pending" },
        select: (m) => ({ postId: (m.state.variables as any)?.post?.id }),
    });
    const isVotePending = (postId: string) => pendingVars.some((v) => v.postId === postId);

    const onVote = async (
        event: React.MouseEvent<SVGElement, MouseEvent>,
        post: Post,
        vote: number,
        communityId: string,
    ) => {
        event.stopPropagation();
        if (!user) {
            window.location.assign("/api/auth/start");
            return;
        }
        const isMember = !!communityStateValue.mySnippets.find((s) => s.communityId === communityId);
        if (!isMember) {
            let community = communityStateValue.currentCommunity;
            if (!community || community.id !== communityId) {
                try { community = (await getCommunityDataAction(communityId)) ?? undefined; }
                catch (error) { console.log("Error fetching community data for vote permission", error); }
            }
            if (community && (community.privacyType === "restricted" || community.privacyType === "private")) {
                showToast({
                    title: "Restricted Community",
                    description: "You must be a member to vote in this community.",
                    status: "error",
                });
                return;
            }
        }

        try {
            await voteMutation.mutateAsync({ post, vote, communityId });
        } catch (error) {
            console.log("Error: onVote", error);
            showToast({
                title: "Could not Vote",
                description: "There was an error voting on the post",
                status: "error",
            });
        }
    };

    return { onVote, isVotePending };
};

export default usePostVote;
```

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm test __tests__/hooks/posts/usePostVote.test.tsx`
Expected: PASS (2/2).

### Task 3.2: Trim `usePostDeletion` to a no-arg shell

**Files:**
- Modify: `hooks/posts/usePostDeletion.ts`
- Test: `__tests__/hooks/posts/usePostDeletion.test.tsx` (new)

- [x] **Step 1: Write the failing test**

```tsx
// __tests__/hooks/posts/usePostDeletion.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/app/actions/posts", () => ({
    deletePostAction: vi.fn(async () => undefined),
}));

import usePostDeletion from "@/hooks/posts/usePostDeletion";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostDeletion (shell)", () => {
    it("removes the post from the infinite feed optimistically and returns true", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
        const p1 = { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as Post;
        client.setQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }), {
            pages: [{ posts: [p1], newLastVisible: null }],
            pageParams: [null],
        });

        const { result } = renderHook(() => usePostDeletion(), { wrapper: wrap(client) });

        let outcome: boolean | undefined;
        await act(async () => { outcome = await result.current.onDeletePost(p1); });

        expect(outcome).toBe(true);
        await waitFor(() => {
            const feed = client.getQueryData<InfiniteData<FeedPage>>(keys.posts.infiniteFeed({ communityId: "c1" }));
            expect(feed!.pages[0].posts).toHaveLength(0);
        });
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/hooks/posts/usePostDeletion.test.tsx`
Expected: FAIL — current `usePostDeletion` requires `{posts, setPosts}` args.

- [x] **Step 3: Rewrite `hooks/posts/usePostDeletion.ts`**

```ts
import { Post } from "@/types/post";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";

const usePostDeletion = () => {
    const deleteMutation = useDeletePostMutation();
    const onDeletePost = async (post: Post): Promise<boolean> => {
        try {
            await deleteMutation.mutateAsync({ postId: post.id! });
            return true;
        } catch (error) {
            console.log("Error deleting post", error);
            return false;
        }
    };
    return { onDeletePost };
};

export default usePostDeletion;
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/hooks/posts/usePostDeletion.test.tsx`
Expected: PASS.

### Task 3.3: Migrate `HomePageClient` to `useInfiniteQuery`

**Files:**
- Modify: `app/HomePageClient.tsx`

- [x] **Step 1: Rewrite the component**

```tsx
"use client";

import CreatePostLink from "@/components/community/CreatePostLink";
import PersonalHome from "@/components/community/PersonalHome";
import Recommendations from "@/components/community/recommendations/Recommendations";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityState from "@/hooks/community/useCommunityState";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { Button, Stack, Text } from "@chakra-ui/react";
import { useMemo } from "react";

export default function HomePageClient() {
    const { data: session, isPending: loadingUser } = useSession();
    const user = session?.user ?? null;
    const { communityStateValue } = useCommunityState();
    const { onSelectPost } = usePostSelection();

    const communityIds = useMemo(
        () => communityStateValue.mySnippets.map((s) => s.communityId),
        [communityStateValue.mySnippets],
    );
    const hasSubs = !!user && communityIds.length > 0;

    const feed = usePostsInfiniteQuery({
        scope: {
            communityIds: hasSubs ? communityIds : undefined,
            isGenericHome: !user || communityIds.length === 0,
        },
        enabled: user ? communityStateValue.snippetFetched : !loadingUser,
    });

    const posts = useMemo(
        () => feed.data?.pages.flatMap((p) => p.posts) ?? [],
        [feed.data],
    );

    const postIds = useMemo(() => posts.map((p) => p.id!), [posts]);
    const votes = useUserPostVotesQuery({ postIds, enabled: !!user });
    const postVotes = votes.data ?? [];

    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();

    const loading = feed.isLoading || feed.isFetching;

    return (
        <PageContent>
            <>
                <CreatePostLink />
                {loading && posts.length === 0 ? (
                    <PostLoader />
                ) : (
                    <Stack gap={3}>
                        {posts.map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                onSelectPost={onSelectPost}
                                onDeletePost={onDeletePost}
                                onVote={onVote}
                                isVotePending={isVotePending(post.id!)}
                                userVoteValue={postVotes.find((v) => v.postId === post.id)?.voteValue}
                                userIsCreator={false}
                                userIsAdmin={
                                    !!communityStateValue.mySnippets.find((s) => s.communityId === post.communityId)?.isModerator
                                }
                                showCommunityImage={true}
                            />
                        ))}
                        {feed.hasNextPage ? (
                            <Button
                                onClick={() => feed.fetchNextPage()}
                                loading={feed.isFetchingNextPage}
                                variant="outline"
                                width="100%"
                                my={4}
                            >
                                Load More
                            </Button>
                        ) : (
                            <Text textAlign="center" p={2} fontSize="sm" color="gray.500">
                                No more posts
                            </Text>
                        )}
                    </Stack>
                )}
            </>
            <Stack gap={2}>
                <Recommendations />
                <PersonalHome />
            </Stack>
        </PageContent>
    );
}
```

- [x] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors related to HomePageClient).

### Task 3.4: Migrate `Posts.tsx` to `useInfiniteQuery`

**Files:**
- Modify: `components/posts/Posts.tsx`

- [x] **Step 1: Rewrite the component**

```tsx
import { Community } from "@/types/community";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { useSession } from "@/lib/auth-client";
import { Button, Stack, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import PostLoader from "../loaders/post-loader/PostLoader";
import PostItem from "./post-item/PostItem";

type PostsProps = { communityData: Community };

const Posts: React.FC<PostsProps> = ({ communityData }) => {
    const { data: session } = useSession();
    const user = session?.user ?? null;
    const { onSelectPost } = usePostSelection();

    const feed = usePostsInfiniteQuery({ scope: { communityId: communityData.id } });
    const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);

    const postIds = useMemo(() => posts.map((p) => p.id!), [posts]);
    const votes = useUserPostVotesQuery({ postIds, enabled: !!user });
    const postVotes = votes.data ?? [];

    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();
    const { isAdmin, canPost } = useCommunityPermissions(communityData);

    const loading = feed.isLoading || feed.isFetching;

    return (
        <>
            {loading && posts.length === 0 ? (
                <PostLoader />
            ) : (
                <Stack gap={3}>
                    {posts.map((item) => (
                        <PostItem
                            key={item.id}
                            post={item}
                            userIsCreator={false}
                            userIsAdmin={isAdmin}
                            userVoteValue={postVotes.find((v) => v.postId === item.id)?.voteValue}
                            onVote={onVote}
                            onSelectPost={onSelectPost}
                            onDeletePost={onDeletePost}
                            votingDisabled={!canPost}
                            isVotePending={isVotePending(item.id!)}
                        />
                    ))}
                    {feed.hasNextPage ? (
                        <Button onClick={() => feed.fetchNextPage()} loading={feed.isFetchingNextPage} variant="outline" width="100%" my={4}>
                            Load More
                        </Button>
                    ) : (
                        <Text textAlign="center" p={2} fontSize="sm" color="gray.500">No more posts</Text>
                    )}
                </Stack>
            )}
        </>
    );
};
export default Posts;
```

(Note: the `/* eslint-disable react-hooks/exhaustive-deps */` directive at the top of the original is no longer needed — gone with the `useEffect`.)

- [x] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

### Task 3.5: Strip local `posts` mirror from `PostClientPage`

**Files:**
- Modify: `app/community/[communityId]/comments/[pid]/PostClientPage.tsx`

- [x] **Step 1: Rewrite the component (keep selectedPost atom mirror for now — removed in Commit 4)**

```tsx
"use client";

import { uiAtom } from "@/atoms/uiAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useCommunityState from "@/hooks/community/useCommunityState";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

type PostPageProps = { communityId: string; postId: string };

const PostPage: React.FC<PostPageProps> = ({ communityId, postId }) => {
    const { data: communityData } = useCommunityDataQuery({ communityId });
    const { data: postData } = usePostQuery({ postId });
    const [, setUi] = useAtom(uiAtom);

    const { postVotes } = usePostVoteSync();
    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();

    const { communityStateValue, setCommunityStateValue } = useCommunityState();
    const fallbackCommunity = (communityData ?? { id: communityId }) as Community;
    const currentCommunity = communityStateValue.currentCommunity ?? fallbackCommunity;
    const { isAdmin, canView, canPost, loading } = useCommunityPermissions(currentCommunity);
    const { data: session } = useSession();
    const user = session?.user ?? null;

    useEffect(() => {
        if (communityData) {
            setCommunityStateValue((prev) => ({
                ...prev,
                currentCommunity: communityData as Community,
            }));
        }
    }, [communityData, setCommunityStateValue]);

    useEffect(() => {
        if (postData) {
            setUi((prev) => ({ ...prev, selectedPost: postData as Post }));
        }
    }, [postData, setUi]);

    if (loading || !communityData) {
        return (
            <PageContent>
                <PostLoader />
                <></>
            </PageContent>
        );
    }

    if (!canView) {
        return (
            <PageContent>
                <RestrictedCommunityBanner />
                <></>
            </PageContent>
        );
    }

    const post = (postData ?? null) as Post | null;

    return (
        <PageContent>
            <>
                <Stack gap={4}>
                    {post && (
                        <PostItem
                            post={post}
                            onVote={onVote}
                            isVotePending={isVotePending(post.id!)}
                            onDeletePost={onDeletePost}
                            userVoteValue={postVotes.find((v) => v.postId === post.id)?.voteValue}
                            userIsCreator={false}
                            userIsAdmin={isAdmin}
                            votingDisabled={!canPost}
                        />
                    )}
                    <Comments
                        user={user}
                        selectedPost={post}
                        communityId={post?.communityId as string}
                        isCommunityAdmin={isAdmin}
                    />
                </Stack>
            </>
            <>
                <About communityData={communityData as Community} />
            </>
        </PageContent>
    );
};

export default PostPage;
```

- [x] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

### Task 3.6: Trim `usePostVoteSync` — drop `setPostVotes` from return

**Files:**
- Modify: `hooks/posts/usePostVoteSync.ts`

- [x] **Step 1: Replace `hooks/posts/usePostVoteSync.ts`**

```ts
"use client";

import { uiAtom } from "@/atoms/uiAtom";
import { useAtomValue } from "jotai";
import { useSession } from "@/lib/auth-client";
import type { PostVote } from "@/types/post";
import { useCommunityPostVotesQuery } from "@/lib/queries/posts/use-post-votes";

const usePostVoteSync = () => {
    const { data: session } = useSession();
    const user = session?.user ?? null;
    const currentCommunity = useAtomValue(uiAtom).currentCommunity;
    const communityId = currentCommunity?.id;

    const { data } = useCommunityPostVotesQuery({
        communityId,
        enabled: !!user && !!communityId,
    });

    const postVotes: PostVote[] = !user || !communityId ? [] : (data ?? []);
    return { postVotes };
};

export default usePostVoteSync;
```

- [x] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS — `PostClientPage` already only destructures `postVotes` per Task 3.5.

### Task 3.7: Delete `usePostsFeed.ts` and old `keys.posts.feed` factory

**Files:**
- Delete: `hooks/posts/usePostsFeed.ts`
- Modify: `lib/queries/keys.ts` (remove `feed` factory)
- Delete: `lib/queries/posts/use-posts-feed.ts` (legacy non-infinite read primitive — no remaining caller)
- Delete: `__tests__/lib/queries/posts/use-posts-feed.test.tsx`

- [x] **Step 1: Confirm no callers remain**

Run: `grep -rn "from.*usePostsFeed\|usePostsFeedQuery\|keys\.posts\.feed[^a-zA-Z]" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/`
Expected: No matches outside `hooks/posts/usePostsFeed.ts` itself.

- [x] **Step 2: Delete files**

```bash
rm hooks/posts/usePostsFeed.ts
rm lib/queries/posts/use-posts-feed.ts
rm __tests__/lib/queries/posts/use-posts-feed.test.tsx
```

- [x] **Step 3: Remove `feed:` from `lib/queries/keys.ts`**

Delete the `feed: (args: { scope: FeedScope; cursor: unknown }) => ["posts", "feed", args] as const,` line from the `posts` block. (`infiniteFeed` stays.)

- [x] **Step 4: Verify the full green gate**

Run: `pnpm test; pnpm typecheck; pnpm eslint; pnpm build`
Expected: all green.

### Task 3.8: Commit consumer migration

- [x] **Step 1: Commit**

```bash
git add -A
git commit -m "refactor(forum): migrate feed consumers to useInfiniteQuery; trim vote/delete shells

HomePageClient, Posts.tsx, and PostClientPage now consume
usePostsInfiniteQuery + useUserPostVotesQuery directly. usePostVote
and usePostDeletion are no-arg shells (mutation owns optimistic).
usePostVoteSync drops setPostVotes from its return. Deletes the
manual paging machine (usePostsFeed.ts), its legacy primitive
(use-posts-feed.ts), and keys.posts.feed. Four mirror useEffects
eliminated."
```

---

## Commit 4 — Delete `uiAtom.selectedPost`

### Task 4.1: `usePostSelection` writes `setQueryData` prefetch instead of atom

**Files:**
- Modify: `hooks/posts/usePostSelection.ts`
- Test: `__tests__/hooks/posts/usePostSelection.test.tsx` (new)

- [x] **Step 1: Write the failing test**

```tsx
// __tests__/hooks/posts/usePostSelection.test.tsx
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
        expect(pushSpy).toHaveBeenCalledWith("/community/c1/comments/p1");
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/hooks/posts/usePostSelection.test.tsx`
Expected: FAIL — current implementation writes the atom, not the query cache.

- [x] **Step 3: Rewrite `hooks/posts/usePostSelection.ts`**

```ts
import { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const usePostSelection = () => {
    const qc = useQueryClient();
    const router = useRouter();

    const onSelectPost = (post: Post) => {
        qc.setQueryData(keys.posts.detail(post.id!), post);
        router.push(`/community/${post.communityId}/comments/${post.id}`);
    };

    return { onSelectPost };
};

export default usePostSelection;
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/hooks/posts/usePostSelection.test.tsx`
Expected: PASS.

### Task 4.2: `useCreateComment` / `useDeleteComment` count bumps via `setQueryData`

**Files:**
- Modify: `hooks/comments/useCreateComment.ts`
- Modify: `hooks/comments/useDeleteComment.ts`

- [x] **Step 1: Replace the atom-write block in `useCreateComment.ts`**

In [`hooks/comments/useCreateComment.ts`](../../../hooks/comments/useCreateComment.ts), delete the `setUi((prev) => ...)` block at lines 62-71 and replace with:

```ts
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
// ... existing imports

// inside the hook, replace `const setUi = useSetAtom(uiAtom);` with:
const qc = useQueryClient();

// inside the try block, after `await mutation.mutateAsync(...)`, replace the setUi(...) call with:
qc.setQueryData<Post>(keys.posts.detail(selectedPost.id!), (old) =>
    old ? { ...old, numberOfComments: old.numberOfComments + 1 } : old,
);
```

Remove the `import { uiAtom } from "@/atoms/uiAtom";` and `import { useSetAtom } from "jotai";` lines (no longer used).

- [x] **Step 2: Replace the atom-write block in `useDeleteComment.ts`**

In [`hooks/comments/useDeleteComment.ts`](../../../hooks/comments/useDeleteComment.ts), delete the `setUi((prev) => ...)` block at lines 30-40 and replace with:

```ts
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import type { Post } from "@/types/post";
// ... existing imports

// inside the hook, replace `const setUi = useSetAtom(uiAtom);` with:
const qc = useQueryClient();

// inside the try block, after `await mutation.mutateAsync(...)`, replace the setUi(...) call with:
qc.setQueryData<Post>(keys.posts.detail(comment.postId), (old) =>
    old ? { ...old, numberOfComments: Math.max(0, old.numberOfComments - 1) } : old,
);
```

Remove the `import { uiAtom } from "@/atoms/uiAtom";` and `import { useSetAtom } from "jotai";` lines.

- [x] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [x] **Step 4: Write a test for the count bump**

```tsx
// __tests__/hooks/comments/useCreateComment.test.tsx (new)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import type { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";

vi.mock("@/lib/auth-client", () => ({ useSession: () => ({ data: { user: { id: "u1" } } }) }));
vi.mock("@/lib/queries/comments/use-create-comment-mutation", () => ({
    useCreateCommentMutation: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}));
vi.mock("@/lib/community/communityPermissions", () => ({
    checkCommunityPermission: () => true,
}));

import useCreateComment from "@/hooks/comments/useCreateComment";

function wrap(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <JotaiProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></JotaiProvider>
    );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreateComment", () => {
    it("bumps numberOfComments on the cached post after a successful create", async () => {
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const post: Post = { id: "p1", communityId: "c1", title: "t", voteStatus: 0, numberOfComments: 3 } as Post;
        client.setQueryData(keys.posts.detail("p1"), post);

        const { result } = renderHook(() => useCreateComment(post), { wrapper: wrap(client) });
        await act(async () => { await result.current.createComment("hi"); });

        await waitFor(() =>
            expect(client.getQueryData<Post>(keys.posts.detail("p1"))?.numberOfComments).toBe(4),
        );
    });
});
```

Repeat the symmetric structure for `useDeleteComment.test.tsx` (mock `useDeleteCommentMutation`, assert `numberOfComments` drops from 3 to 2 after `deleteComment({ id, postId: "p1" } as any)`).

- [x] **Step 5: Run tests**

Run: `pnpm test __tests__/hooks/comments/`
Expected: PASS for the two new files plus the existing comment-mutation tests.

### Task 4.3: `PostClientPage` reads `postData` directly; drop selectedPost mirror

**Files:**
- Modify: `app/community/[communityId]/comments/[pid]/PostClientPage.tsx`

- [x] **Step 1: Replace the file (final shape)**

```tsx
"use client";

import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useCommunityState from "@/hooks/community/useCommunityState";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import React, { useEffect } from "react";

type PostPageProps = { communityId: string; postId: string };

const PostPage: React.FC<PostPageProps> = ({ communityId, postId }) => {
    const { data: communityData } = useCommunityDataQuery({ communityId });
    const { data: postData } = usePostQuery({ postId });

    const { postVotes } = usePostVoteSync();
    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();

    const { communityStateValue, setCommunityStateValue } = useCommunityState();
    const fallbackCommunity = (communityData ?? { id: communityId }) as Community;
    const currentCommunity = communityStateValue.currentCommunity ?? fallbackCommunity;
    const { isAdmin, canView, canPost, loading } = useCommunityPermissions(currentCommunity);
    const { data: session } = useSession();
    const user = session?.user ?? null;

    // currentCommunity mirror still present — removed in Commit 5.
    useEffect(() => {
        if (communityData) {
            setCommunityStateValue((prev) => ({
                ...prev,
                currentCommunity: communityData as Community,
            }));
        }
    }, [communityData, setCommunityStateValue]);

    if (loading || !communityData) {
        return (<PageContent><PostLoader /><></></PageContent>);
    }
    if (!canView) {
        return (<PageContent><RestrictedCommunityBanner /><></></PageContent>);
    }

    const post = (postData ?? null) as Post | null;

    return (
        <PageContent>
            <>
                <Stack gap={4}>
                    {post && (
                        <PostItem
                            post={post}
                            onVote={onVote}
                            isVotePending={isVotePending(post.id!)}
                            onDeletePost={onDeletePost}
                            userVoteValue={postVotes.find((v) => v.postId === post.id)?.voteValue}
                            userIsCreator={false}
                            userIsAdmin={isAdmin}
                            votingDisabled={!canPost}
                        />
                    )}
                    <Comments
                        user={user}
                        selectedPost={post}
                        communityId={post?.communityId as string}
                        isCommunityAdmin={isAdmin}
                    />
                </Stack>
            </>
            <>
                <About communityData={communityData as Community} />
            </>
        </PageContent>
    );
};

export default PostPage;
```

- [x] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

### Task 4.4: Audit and migrate remaining `selectedPost` consumers

**Files:**
- Modify: any file that reads `uiAtom.selectedPost` outside `usePostState.ts` (to be deleted next).
- Modify: any file that writes `uiAtom.selectedPost`.

- [x] **Step 1: Find all references**

Run: `grep -rn "selectedPost" --include="*.ts" --include="*.tsx" app/ components/ hooks/ atoms/ lib/`

Expected matches (verify each):

| Match | Action |
|---|---|
| `atoms/uiAtom.ts` (field decl + default) | Removed in Task 4.5 |
| `app/community/[communityId]/comments/[pid]/PostClientPage.tsx` | Already done in Task 4.3 |
| `components/posts/comments/Comments.tsx` (`selectedPost` PROP, not atom read) | No change — prop comes from PostClientPage |
| `components/posts/comments/CommentItem.tsx` (likely prop pass-through) | Verify — no change if prop only |
| `hooks/comments/useCreateComment.ts` — receives `selectedPost: Post \| null` as ARG, not from atom | No change |
| `hooks/posts/usePostState.ts` | Deleted in Task 4.5 |
| `hooks/posts/usePostVote.tsx` | Already trimmed in Task 3.1 — no remaining `selectedPost`/`setUi` reads |
| Any other readers (Icons.tsx, etc.) | Replace with direct prop or query read as appropriate |

- [x] **Step 2: For each non-matched read site found**

If a remaining reader is found, replace with either:
- a) Read from `usePostQuery({ postId })` if the postId is in scope (route param or prop).
- b) Accept the post object as a prop from the route component.

The grep result is the authoritative list; if a site needs deeper analysis the task fails forward into a follow-up commit.

### Task 4.5: Remove `selectedPost` from `uiAtom`; delete `usePostState.ts`

**Files:**
- Modify: `atoms/uiAtom.ts`
- Delete: `hooks/posts/usePostState.ts`

- [x] **Step 1: Confirm no remaining `uiAtom.selectedPost` reads**

Run: `grep -rn "selectedPost" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/ | grep -v "selectedPost:" | grep -v "atoms/uiAtom" | grep -v "PostClientPage" | grep -v "Comments.tsx" | grep -v "CommentItem" | grep -v "useCreateComment\|useDeleteComment"`
Expected: No matches. (The remaining hits are either field declarations, props, or already-handled sites.)

- [x] **Step 2: Edit `atoms/uiAtom.ts`**

```ts
import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { Community } from "@/types/community";
import { DirectoryMenuItem } from "@/types/directoryMenu";

interface DirectoryMenuState {
    isOpen: boolean;
    selectedMenuItem: DirectoryMenuItem;
}

export interface UiState {
    currentCommunity: Community | null;   // removed in Commit 5
    directoryMenu: DirectoryMenuState;
    savedPostsModalOpen: boolean;
}

export const defaultMenuItem: DirectoryMenuItem = {
    displayText: "Home",
    link: "/",
    icon: TiHome,
    iconColor: { base: "black", _dark: "white" },
};

const defaultUiState: UiState = {
    currentCommunity: null,
    directoryMenu: { isOpen: false, selectedMenuItem: defaultMenuItem },
    savedPostsModalOpen: false,
};

export const uiAtom = atom<UiState>(defaultUiState);
```

(Removed: `import { Post } from "@/types/post";`, the `selectedPost: Post | null` field, the `selectedPost: null` default.)

- [x] **Step 3: Delete `hooks/posts/usePostState.ts`**

```bash
rm hooks/posts/usePostState.ts
```

- [x] **Step 4: Run the full green gate**

Run: `pnpm test; pnpm typecheck; pnpm eslint; pnpm build`
Expected: all green.

### Task 4.6: Commit selectedPost deletion

- [x] **Step 1: Commit**

```bash
git add -A
git commit -m "refactor(forum): delete uiAtom.selectedPost

PostClientPage reads usePostQuery directly. usePostSelection seeds
the detail cache via setQueryData. useCreateComment and
useDeleteComment bump numberOfComments via setQueryData on the
detail cache. usePostState.ts deleted. Mirror useEffect for
postData -> selectedPost removed."
```

---

## Commit 5 — Delete `uiAtom.currentCommunity`; introduce `useActiveCommunity`

### Task 5.1: Add `useActiveCommunity` hook

**Files:**
- Create: `hooks/community/useActiveCommunity.ts`
- Test: `__tests__/hooks/community/useActiveCommunity.test.tsx` (new)

- [x] **Step 1: Write the failing test**

```tsx
// __tests__/hooks/community/useActiveCommunity.test.tsx
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/hooks/community/useActiveCommunity.test.tsx`
Expected: FAIL — import error.

- [x] **Step 3: Implement the hook**

```ts
// hooks/community/useActiveCommunity.ts
"use client";

import { useParams } from "next/navigation";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

export function useActiveCommunity() {
    const params = useParams<{ communityId?: string }>();
    const communityId = params?.communityId;
    const query = useCommunityDataQuery({
        communityId: communityId ?? "",
        enabled: !!communityId,
    });
    return {
        communityId,
        community: communityId ? query.data ?? undefined : undefined,
        isLoading: query.isLoading,
    };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/hooks/community/useActiveCommunity.test.tsx`
Expected: PASS (2/2).

### Task 5.2: Trim `useCommunityState` to snippets-only

**Files:**
- Modify: `hooks/community/useCommunityState.ts`

- [x] **Step 1: Replace the file**

```ts
"use client";

import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { CommunitySnippet } from "@/types/community";
import { useMemo } from "react";

export interface CommunityStateValue {
    mySnippets: CommunitySnippet[];
    snippetFetched: boolean;
}

const useCommunityState = () => {
    const snippetsQuery = useCommunitySnippetsQuery();
    const communityStateValue: CommunityStateValue = useMemo(
        () => ({
            mySnippets: (snippetsQuery.data ?? []) as CommunitySnippet[],
            snippetFetched: snippetsQuery.isSuccess,
        }),
        [snippetsQuery.data, snippetsQuery.isSuccess],
    );
    return { communityStateValue };
};

export default useCommunityState;
```

(Removed: `currentCommunity` field, `setCommunityStateValue`, `uiAtom` import, `useQueryClient`, `useSession`, all atom write paths.)

- [x] **Step 2: Verify typecheck — expect many errors**

Run: `pnpm typecheck`
Expected: FAIL — consumers reading `communityStateValue.currentCommunity` or `setCommunityStateValue` no longer compile. The next tasks fix each one.

### Task 5.3: Migrate `PostClientPage` and `CommunityClientPage` (drop the community mirror effect)

**Files:**
- Modify: `app/community/[communityId]/comments/[pid]/PostClientPage.tsx`
- Modify: `app/community/[communityId]/comments/CommunityClientPage.tsx`

- [x] **Step 1: Replace `PostClientPage.tsx`**

```tsx
"use client";

import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import React from "react";

type PostPageProps = { communityId: string; postId: string };

const PostPage: React.FC<PostPageProps> = ({ communityId, postId }) => {
    const { data: communityData } = useCommunityDataQuery({ communityId });
    const { data: postData } = usePostQuery({ postId });
    const { postVotes } = usePostVoteSync();
    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();
    const currentCommunity = (communityData ?? { id: communityId }) as Community;
    const { isAdmin, canView, canPost, loading } = useCommunityPermissions(currentCommunity);
    const { data: session } = useSession();
    const user = session?.user ?? null;

    if (loading || !communityData) return (<PageContent><PostLoader /><></></PageContent>);
    if (!canView) return (<PageContent><RestrictedCommunityBanner /><></></PageContent>);

    const post = (postData ?? null) as Post | null;

    return (
        <PageContent>
            <>
                <Stack gap={4}>
                    {post && (
                        <PostItem
                            post={post}
                            onVote={onVote}
                            isVotePending={isVotePending(post.id!)}
                            onDeletePost={onDeletePost}
                            userVoteValue={postVotes.find((v) => v.postId === post.id)?.voteValue}
                            userIsCreator={false}
                            userIsAdmin={isAdmin}
                            votingDisabled={!canPost}
                        />
                    )}
                    <Comments
                        user={user}
                        selectedPost={post}
                        communityId={post?.communityId as string}
                        isCommunityAdmin={isAdmin}
                    />
                </Stack>
            </>
            <>
                <About communityData={communityData as Community} />
            </>
        </PageContent>
    );
};

export default PostPage;
```

(The `useEffect` mirror is gone. `currentCommunity` is derived from `communityData` per-render.)

- [ ] **Step 2: Read and migrate `CommunityClientPage.tsx`**

The exact rewrite depends on the file's current shape. The pattern is identical to `PostClientPage`:

1. Drop any `useCommunityState` calls referencing `currentCommunity` or `setCommunityStateValue`.
2. Use `useCommunityDataQuery({ communityId })` to get the community object.
3. Delete any `useEffect` that mirrors `communityData` into `setCommunityStateValue`.

Open the file, apply the pattern, verify typecheck.

- [ ] **Step 3: Verify typecheck against these two files**

Run: `pnpm typecheck 2>&1 | grep -E "PostClientPage|CommunityClientPage"`
Expected: No errors from these two files. Other files still error (handled in remaining tasks).

### Task 5.4: Migrate all remaining `useCommunityState`/`uiAtom.currentCommunity` consumers

**Files:**
- Modify: `app/HomePageClient.tsx`
- Modify: `components/posts/comments/Comments.tsx`
- Modify: `hooks/comments/useCreateComment.ts`
- Modify: `hooks/posts/usePostVote.tsx`
- Modify: `hooks/posts/usePostVoteSync.ts`
- Modify: `components/navbar/right-content/Icons.tsx`
- Modify: `app/community/[communityId]/submit/SubmitPostClientPage.tsx`
- Modify: `components/community/CreatePostLink.tsx`
- Modify: `components/community/community-header/CommunityHeader.tsx`
- Modify: `app/communities/page.tsx`
- Modify: `components/community/recommendations/Recommendations.tsx`
- Modify: `components/community/about/About.tsx`

For each file, the migration rule is fixed (no per-site novelty):

- **Reads `mySnippets` / `snippetFetched` only** → no change required. `useCommunityState` still returns these.
- **Reads `currentCommunity` AND has a `communityId` in scope (route param, prop, or selectedPost-like context)** → replace with `useCommunityDataQuery({ communityId })`. Drop the `useCommunityState` call if `currentCommunity` was its only consumed field.
- **Reads `currentCommunity` AND does NOT have a `communityId` in scope** → use `useActiveCommunity()`. The hook is route-aware.
- **Writes `currentCommunity` via `setCommunityStateValue`** → delete the write (and any `useEffect` that wraps it). The community is now derived per-render.

- [ ] **Step 1: Migrate `HomePageClient.tsx`**

Already uses `mySnippets` / `snippetFetched` only after Task 3.3. No change.

Verify: `grep -n "currentCommunity\|setCommunityStateValue" app/HomePageClient.tsx`
Expected: no matches.

- [ ] **Step 2: Migrate `Comments.tsx`**

Replace [`Comments.tsx:48-50`](../../../components/posts/comments/Comments.tsx#L48-L50):

```ts
// BEFORE
const { communityStateValue } = useCommunityState();
const { canComment } = useCommunityPermissions(communityStateValue.currentCommunity);

// AFTER
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
const { data: communityData } = useCommunityDataQuery({ communityId });
const { canComment } = useCommunityPermissions(communityData ?? undefined);
```

Remove the `import useCommunityState from "@/hooks/community/useCommunityState";` line.

- [ ] **Step 3: Migrate `useCreateComment.ts`**

Replace the permission-check block ([`useCreateComment.ts:37-52`](../../../hooks/comments/useCreateComment.ts#L37-L52)):

```ts
// BEFORE
const { communityStateValue } = useCommunityState();
const currentCommunity = communityStateValue.currentCommunity;
if (currentCommunity?.id === selectedPost.communityId) {
    const hasPermission = checkCommunityPermission(currentCommunity, communityStateValue.mySnippets);
    if (!hasPermission) { /* toast + return */ }
}

// AFTER
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { getCommunityDataAction } from "@/app/actions/reads";
import type { Community } from "@/types/community";

// inside the hook body
const qc = useQueryClient();
const snippets = useCommunitySnippetsQuery();

// inside onCreateComment, replace the permission-check block:
const cachedCommunity = qc.getQueryData<Community>(keys.community.detail(selectedPost.communityId));
const community = cachedCommunity ?? (await qc.fetchQuery({
    queryKey: keys.community.detail(selectedPost.communityId),
    queryFn: () => getCommunityDataAction(selectedPost.communityId),
}));
if (community) {
    const hasPermission = checkCommunityPermission(community as Community, snippets.data ?? []);
    if (!hasPermission) {
        showToast({ title: "Restricted Community", description: "You must be a member to comment in this community.", status: "error" });
        setCreateLoading(false);
        return;
    }
}
```

Remove `import useCommunityState from "../community/useCommunityState";`.

- [ ] **Step 4: Migrate `usePostVote.tsx`**

In [`hooks/posts/usePostVote.tsx`](../../../hooks/posts/usePostVote.tsx) (the trimmed shell from Task 3.1), replace the `useCommunityState` reads:

```ts
// BEFORE
const { communityStateValue } = useCommunityState();
// ...
const isMember = !!communityStateValue.mySnippets.find((s) => s.communityId === communityId);
// ...
let community = communityStateValue.currentCommunity;
if (!community || community.id !== communityId) {
    try { community = (await getCommunityDataAction(communityId)) ?? undefined; } catch { ... }
}

// AFTER
import { useQueryClient } from "@tanstack/react-query";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { keys } from "@/lib/queries/keys";

// inside the hook body
const qc = useQueryClient();
const snippets = useCommunitySnippetsQuery();
const mySnippets = snippets.data ?? [];

// inside onVote
const isMember = !!mySnippets.find((s) => s.communityId === communityId);
// ...
let community = qc.getQueryData<Community>(keys.community.detail(communityId));
if (!community) {
    try {
        community = (await qc.fetchQuery({
            queryKey: keys.community.detail(communityId),
            queryFn: () => getCommunityDataAction(communityId),
        })) ?? undefined;
    } catch (error) {
        console.log("Error fetching community data for vote permission", error);
    }
}
```

Remove `import useCommunityState from "../community/useCommunityState";`.

- [ ] **Step 5: Migrate `usePostVoteSync.ts`**

The hook still reads `uiAtom.currentCommunity` to scope votes by community. After this commit, the atom field is gone. Replace:

```ts
// BEFORE
const currentCommunity = useAtomValue(uiAtom).currentCommunity;
const communityId = currentCommunity?.id;

// AFTER
import { useActiveCommunity } from "@/hooks/community/useActiveCommunity";
const { communityId } = useActiveCommunity();
```

Remove the `import { uiAtom } from "@/atoms/uiAtom";` and `useAtomValue` imports if no other use remains.

- [ ] **Step 6: Migrate `Icons.tsx`**

Read [`components/navbar/right-content/Icons.tsx`](../../../components/navbar/right-content/Icons.tsx). For every read of `communityStateValue.currentCommunity`, replace with `useActiveCommunity().community`. Keep `mySnippets` reads via `useCommunityState` as-is.

- [ ] **Step 7: Migrate `SubmitPostClientPage.tsx`**

Read the file. The community id is in the route. Pattern:

```ts
// BEFORE
const { communityStateValue, setCommunityStateValue } = useCommunityState();
useEffect(() => { /* mirror communityData -> setCommunityStateValue */ }, [...]);

// AFTER
const { data: communityData } = useCommunityDataQuery({ communityId });
// (delete useEffect; use communityData directly)
```

- [ ] **Step 8: Migrate `CreatePostLink.tsx`**

Replace any `useCommunityState`-derived community read with `useActiveCommunity().community`.

- [ ] **Step 9: Migrate `CommunityHeader.tsx`**

Read the file. If it receives `communityData` as a prop already (from a parent), no change. Otherwise replace `useCommunityState` read with `useActiveCommunity()`.

- [ ] **Step 10: Migrate `app/communities/page.tsx`, `Recommendations.tsx`, `About.tsx`**

Read each file. Apply the migration rule above. Expected: most use `mySnippets` only (no change required) per the spec verification.

- [ ] **Step 11: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS — all consumers migrated.

- [ ] **Step 12: Confirm no atom-currentCommunity reads remain**

Run: `grep -rn "uiAtom" app/ components/ hooks/ atoms/ lib/ --include="*.ts" --include="*.tsx" | grep -v "atoms/uiAtom"`
Expected: any remaining matches read `uiAtom.directoryMenu` or `uiAtom.savedPostsModalOpen` only.

Run: `grep -rn "currentCommunity" app/ components/ hooks/ lib/ --include="*.ts" --include="*.tsx" | grep -v "atoms/uiAtom"`
Expected: no matches outside docs/plans.

### Task 5.5: Delete `currentCommunity` from `uiAtom`

**Files:**
- Modify: `atoms/uiAtom.ts`

- [ ] **Step 1: Replace `atoms/uiAtom.ts`**

```ts
import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { DirectoryMenuItem } from "@/types/directoryMenu";

interface DirectoryMenuState {
    isOpen: boolean;
    selectedMenuItem: DirectoryMenuItem;
}

export interface UiState {
    directoryMenu: DirectoryMenuState;
    savedPostsModalOpen: boolean;
}

export const defaultMenuItem: DirectoryMenuItem = {
    displayText: "Home",
    link: "/",
    icon: TiHome,
    iconColor: { base: "black", _dark: "white" },
};

const defaultUiState: UiState = {
    directoryMenu: { isOpen: false, selectedMenuItem: defaultMenuItem },
    savedPostsModalOpen: false,
};

export const uiAtom = atom<UiState>(defaultUiState);
```

- [ ] **Step 2: Run full green gate**

Run: `pnpm test && pnpm typecheck && pnpm eslint && pnpm build`
Expected: all green.

### Task 5.6: Commit currentCommunity deletion

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "refactor(forum): delete uiAtom.currentCommunity; introduce useActiveCommunity

15 consumers migrated to route-derived useActiveCommunity() or
direct useCommunityDataQuery(communityId). useCommunityState
trimmed to snippets-only. PostClientPage / CommunityClientPage /
SubmitPostClientPage no longer mirror community data into a jotai
atom. uiAtom is now genuinely client-only UI state."
```

---

## Commit 6 — Lint sweep

### Task 6.1: Remove any orphan `eslint-disable` comments from the lint-only pass

**Files:**
- Modify: `app/HomePageClient.tsx`
- Modify: `app/community/[communityId]/comments/[pid]/PostClientPage.tsx`
- Modify: `components/posts/Posts.tsx`

- [ ] **Step 1: Find orphan disables**

Run: `grep -rn "eslint-disable" app/ components/ hooks/ --include="*.ts" --include="*.tsx"`

For each match, verify whether the line below it still triggers the named rule. After the refactor most should be unnecessary.

- [ ] **Step 2: Run lint to confirm**

Run: `pnpm eslint`

Any "Unused eslint-disable directive" warning indicates a line to delete. Delete those lines.

- [ ] **Step 3: Re-run lint**

Run: `pnpm eslint`
Expected: no "Unused eslint-disable directive" warnings.

### Task 6.2: Fix `<img>` → `next/image` in `ImageCropModal`

**Files:**
- Modify: `components/modal/image-crop/ImageCropModal.tsx`

- [ ] **Step 1: Replace the `<img>` with a documented disable**

The image source here is a data URL from `FileReader.readAsDataURL`. `next/image` requires either a configured domain or `unoptimized`. Since this is a transient in-browser crop preview (never served from the network), the right answer is `unoptimized` OR a targeted disable with reason. Choose the disable for minimum risk:

Replace [`ImageCropModal.tsx:132-138`](../../../components/modal/image-crop/ImageCropModal.tsx#L132-L138):

```tsx
{/* eslint-disable-next-line @next/next/no-img-element -- in-browser FileReader data URL preview; next/image adds no value here */}
<img
    ref={imgRef}
    src={imgSrc}
    alt="Crop source"
    onLoad={onImageLoad}
    style={{ maxHeight: "60vh", maxWidth: "100%" }}
/>
```

- [ ] **Step 2: Run lint**

Run: `pnpm eslint components/modal/image-crop/ImageCropModal.tsx`
Expected: no warnings from this file.

### Task 6.3: Switch `CommentInput.tsx` from `watch()` to `useWatch`

**Files:**
- Modify: `components/posts/comments/CommentInput.tsx`

- [ ] **Step 1: Apply the same pattern already used in `AdminManager.tsx` and `CreateCommunityModal.tsx`**

```tsx
// BEFORE
import { useForm } from "react-hook-form";
// ...
const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<CommentInputType>({ ... });
const commentText = watch("text");

// AFTER
import { useForm, useWatch } from "react-hook-form";
// ...
const { register, handleSubmit, reset, control, formState: { errors, isValid } } = useForm<CommentInputType>({ ... });
const commentText = useWatch({ control, name: "text" });
```

- [ ] **Step 2: Run lint**

Run: `pnpm eslint components/posts/comments/CommentInput.tsx`
Expected: no "incompatible-library" warnings.

### Task 6.4: Final green gate + commit

- [ ] **Step 1: Run the full gate**

Run: `pnpm test && pnpm typecheck && pnpm eslint && pnpm build`
Expected: all green. `pnpm eslint` reports zero problems (or only the irrelevant per-route warnings unrelated to this refactor).

- [ ] **Step 2: Confirm no remaining `useEffect` mirrors of server state**

Run: `grep -rn "useEffect" app/HomePageClient.tsx app/community/ components/posts/ hooks/posts/ hooks/comments/ hooks/community/`

For each match, verify the effect is not mirroring server state into React/jotai state. Acceptable patterns:
- `useEffect` that subscribes to a non-React API (event listener, IntersectionObserver, etc.).
- `useEffect` that synchronizes UI-only state with a prop or route param.

Unacceptable (and now absent):
- `useEffect(() => { setX(serverData) }, [serverData])`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(forum): final lint sweep — remove orphan disables, fix img + useWatch"
```

---

## Self-review checklist

After implementing all six commits, verify:

- [ ] Zero `useEffect` calls mirror TanStack-Query data into React state or jotai atoms (grep the directories above).
- [ ] `hooks/posts/usePostsFeed.ts` does not exist.
- [ ] `hooks/posts/usePostState.ts` does not exist.
- [ ] `lib/queries/posts/use-posts-feed.ts` does not exist.
- [ ] `atoms/uiAtom.ts` `UiState` contains only `directoryMenu` and `savedPostsModalOpen`.
- [ ] `usePostVote()` and `usePostDeletion()` take no arguments at all three call sites.
- [ ] `usePostsInfiniteQuery`, `useUserPostVotesQuery`, `useActiveCommunity` exist with passing tests.
- [ ] `pnpm test && pnpm typecheck && pnpm eslint && pnpm build` returns four clean exits.

---

## Out of scope reminder

Do not touch (per spec §Out of scope):
- `useCommunitiesFeed` — separate `useInfiniteQuery` migration.
- Optimistic UI for `join` / `save` / `subscribe` / community-CRUD mutations.
- Server actions, schema, auth.
- The `AdminManager.tsx` and `CreateCommunityModal.tsx` partial edits made earlier in the same session are kept as-is.
