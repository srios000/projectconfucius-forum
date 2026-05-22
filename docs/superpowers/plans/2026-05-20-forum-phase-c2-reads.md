# Phase C2 — Reads + Hydration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every read-shaped hook to TanStack Query under `lib/queries/`, add `<HydrationBoundary>` to the four SSR pages, and decompose the server-state Jotai atoms (`postStateAtom` → `selectedPost` only; delete `communitiesAtom`, `savedPostsAtom`; fold `directoryMenuAtom` into a new `uiAtom.ts`). After C2: zero `set-state-in-effect` TanStack-tagged suppressions remain, no read-shaped `useState + useEffect → action` patterns survive in migrated hooks.

**Architecture:** Hybrid (per spec §3). New primitive `useXxxQuery` hooks live in `lib/queries/<group>/use-foo.ts`. Existing hooks under `hooks/<group>/<name>.ts` become **thin shells** that:
1. delegate fetching to the new primitive
2. **temporarily mirror** the query result into the dying Jotai atom so component-side atom readers keep working mid-migration
3. preserve the legacy hook's exported call surface so component files don't change in C2

Atom decomposition is the **last code task** in C2 — after every consumer can read from either the query hook or the new `uiAtom`, the dying atom files get deleted in one commit. Every commit before atom-decomp boots green even if some consumers still read from the dying atoms.

**Tech Stack:** TanStack Query v5 (installed in C1), Next 16 App Router with React 19 (SSR + HydrationBoundary), Jotai (UI-state only after this phase), Vitest + happy-dom + Testing Library, pnpm.

**Spec reference:** [docs/superpowers/specs/2026-05-20-forum-phase-c-tanstack-query-design.md](../specs/2026-05-20-forum-phase-c-tanstack-query-design.md) §3 (hybrid approach), §4 (architecture), §4.3 (queryKey factory), §4.5 (SSR hydration targets), §5 (cache config), §7 (Jotai decomposition), §8 (C2 green gate), §10 (testing strategy), §12 (out of scope — `useInfiniteQuery` deferred).

---

## File Structure

**New files (`lib/queries/`):**
- `lib/queries/posts/use-posts-feed.ts` — `usePostsFeedQuery` (cursor-paged)
- `lib/queries/posts/use-post.ts` — `usePostQuery`
- `lib/queries/posts/use-post-votes.ts` — `useCommunityPostVotesQuery`
- `lib/queries/posts/use-saved-posts.ts` — `useSavedPostsQuery`
- `lib/queries/community/use-communities.ts` — `useCommunitiesQuery` (cursor-paged)
- `lib/queries/community/use-community-data.ts` — `useCommunityDataQuery`
- `lib/queries/community/use-community-snippets.ts` — `useCommunitySnippetsQuery`
- `lib/queries/community/use-community-members.ts` — `useCommunityMembersQuery`
- `lib/queries/community/use-community-admins.ts` — `useCommunityAdminsQuery`
- `lib/queries/comments/use-comments.ts` — `useCommentsForPostQuery`
- `lib/queries/admin/use-admin-search.ts` — `useAdminSearchUsersQuery` + `useAdminFindUserQuery`
- `lib/queries/search/use-search.ts` — `useSearchQuery` (debounced)

**New test helpers + tests:**
- `__tests__/helpers/renderWithProviders.tsx` — wraps a fresh `QueryClient` (`retry: false, gcTime: 0`) and Jotai provider
- `__tests__/lib/queries/posts/use-posts-feed.test.ts`
- `__tests__/lib/queries/community/use-community-data.test.ts`
- `__tests__/lib/queries/comments/use-comments.test.ts`
- `__tests__/lib/queries/admin/use-admin-search.test.ts`
- `__tests__/lib/queries/search/use-search.test.ts`

**Rewritten as shells (under `hooks/`):**
- `hooks/posts/usePostsFeed.ts`
- `hooks/posts/usePostVoteSync.ts`
- `hooks/posts/useSavedPosts.tsx` (read portion only; `onSavePost` / `onRemoveSavedPost` mutations untouched until C3)
- `hooks/community/useCommunitiesFeed.ts`
- `hooks/community/useCommunitySnippets.ts`
- `hooks/community/useCommunityMembers.ts`
- `hooks/admin/useAdminList.ts`
- `hooks/admin/useAdminSearch.ts`
- `hooks/comments/useCommentList.ts`
- `hooks/useSearch.tsx`

**Modified SSR pages (HydrationBoundary):**
- `app/page.tsx` (home — wraps `<HomePageClient>` already there, plus prefetch)
- `app/community/[communityId]/page.tsx` (wraps the `CommunityClientPage` mount + prefetch community data)
- `app/community/[communityId]/comments/[pid]/page.tsx` (wraps `PostClientPage` + prefetch post + comments)
- `app/community/[communityId]/submit/page.tsx` (wraps `SubmitPostClientPage` + prefetch community data)

**Atom decomposition:**
- `atoms/uiAtom.ts` — NEW. Shape: `{ selectedPost: Post | null; directoryMenu: { isOpen: boolean; selectedMenuItem: DirectoryMenuItem | null }; currentCommunity: Community | null }`
- `atoms/postsAtom.ts` — DELETE (`selectedPost` moves to `uiAtom`; `posts`, `postVotes` deleted)
- `atoms/communitiesAtom.ts` — DELETE (`mySnippets` → query, `currentCommunity` → `uiAtom`)
- `atoms/savedPostsAtom.ts` — DELETE (`savedPosts` → query)
- `atoms/directoryMenuAtom.ts` — DELETE (fields move into `uiAtom`)

---

## Task 1: Test helper `renderWithProviders` + smoke test

**Files:**
- Create: `__tests__/helpers/renderWithProviders.tsx`
- Create: `__tests__/helpers/renderWithProviders.test.tsx`

- [x] **Step 1: Write the failing smoke test**

Create `__tests__/helpers/renderWithProviders.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { renderWithProviders } from "./renderWithProviders";
import { waitFor } from "@testing-library/react";

function HookProbe({ onData }: { onData: (v: unknown) => void }) {
  const q = useQuery({
    queryKey: ["probe"],
    queryFn: async () => "ok",
  });
  if (q.data) onData(q.data);
  return <span data-testid="probe">{q.data ?? "loading"}</span>;
}

describe("renderWithProviders", () => {
  it("provides a working QueryClient", async () => {
    let captured: unknown = null;
    const { getByTestId } = renderWithProviders(
      <HookProbe onData={(v) => (captured = v)} />,
    );
    await waitFor(() => expect(getByTestId("probe").textContent).toBe("ok"));
    expect(captured).toBe("ok");
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/helpers/renderWithProviders.test.tsx
```

Expected: FAIL — `Cannot find module './renderWithProviders'`.

- [x] **Step 3: Write the helper**

Create `__tests__/helpers/renderWithProviders.tsx`:

```tsx
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";

function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

type Options = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { queryClient = makeTestQueryClient(), ...rest } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </JotaiProvider>
    );
  }
  return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient };
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/helpers/renderWithProviders.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add __tests__/helpers/
git commit -m "test: add renderWithProviders helper with QueryClient + Jotai"
```

---

## Task 2: Migrate `usePostsFeed` (cursor-paged feed read)

**Files:**
- Create: `lib/queries/posts/use-posts-feed.ts`
- Create: `__tests__/lib/queries/posts/use-posts-feed.test.ts`
- Modify (rewrite): `hooks/posts/usePostsFeed.ts`

Today `usePostsFeed` exposes `{ loading, fetchPosts, noMorePosts }` and writes accumulated `posts: Post[]` into `postStateAtom.posts`. The new shape splits responsibilities: the **query** holds the latest *page* keyed by cursor + scope; the **shell** keeps the legacy `fetchPosts` API by accumulating pages in component-local `useState` (per spec §12) and mirroring the accumulated array into `postStateAtom.posts` (transitional — the atom field dies in Task 15).

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/posts/use-posts-feed.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@/app/actions/reads", () => ({
  getPostsAction: vi.fn(async () => ({
    posts: [{ id: "p1", title: "hello" }],
    newLastVisible: { id: "p1" },
  })),
}));

import { getPostsAction } from "@/app/actions/reads";
import { usePostsFeedQuery } from "@/lib/queries/posts/use-posts-feed";
import { keys } from "@/lib/queries/keys";

beforeEach(() => vi.clearAllMocks());

describe("usePostsFeedQuery", () => {
  it("fetches the first page and exposes it under the feed key", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Wrapper({ children }: { children: React.ReactNode }) {
      const { wrapper } = renderWithProviders(<></>, { queryClient: client }) as any;
      return wrapper ? wrapper({ children }) : <>{children}</>;
    }
    const { result } = renderHook(
      () =>
        usePostsFeedQuery({
          scope: { communityId: "c1" },
          cursor: null,
        }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>, { queryClient: client })
            .container as any,
      },
    );
    await waitFor(() => expect(result.current.data?.posts?.[0]?.id).toBe("p1"));
    expect(getPostsAction).toHaveBeenCalledWith("c1", undefined, undefined, null);
    expect(
      client.getQueryData(
        keys.posts.feed({ scope: { communityId: "c1" }, cursor: null }),
      ),
    ).toBeDefined();
  });
});
```

Note: the wrapper pattern above keeps the test using the helper; if the project already has a `wrapper` accessor on `renderWithProviders`, adapt accordingly. The two assertions that matter are (a) `data.posts[0].id === "p1"` and (b) the cache holds an entry under the cursor-keyed key.

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/posts/use-posts-feed.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/queries/posts/use-posts-feed'`.

- [x] **Step 3: Update `lib/queries/keys.ts` to support paged feed key**

Open `lib/queries/keys.ts`. The `keys.posts.feed` factory must accept `{ scope, cursor }` so each page has its own cache slot. Replace the `feed` entry:

```ts
type FeedScope = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

export const keys = {
  posts: {
    all: ["posts"] as const,
    feed: (args: { scope: FeedScope; cursor: unknown }) =>
      ["posts", "feed", args] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
    votes: (communityId: string) => ["posts", "votes", communityId] as const,
    saved: (userId: string) => ["posts", "saved", userId] as const,
  },
  // ... existing community / comments / admin / search / profile entries unchanged
} as const;
```

If `keys.posts.feed`'s old signature was different, update `__tests__/lib/queries/keys.test.ts` accordingly so its existing assertions still hold.

- [x] **Step 4: Write the query primitive**

Create `lib/queries/posts/use-posts-feed.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { PostCursor } from "@/lib/posts/getPosts";

export type PostsFeedScope = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

export type UsePostsFeedQueryArgs = {
  scope: PostsFeedScope;
  cursor: PostCursor;
  enabled?: boolean;
};

export function usePostsFeedQuery({
  scope,
  cursor,
  enabled = true,
}: UsePostsFeedQueryArgs) {
  return useQuery({
    queryKey: keys.posts.feed({ scope, cursor }),
    queryFn: () =>
      getPostsAction(
        scope.communityId,
        scope.communityIds,
        scope.isGenericHome,
        cursor,
      ),
    enabled,
    staleTime: 0,
  });
}
```

- [x] **Step 5: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/posts/use-posts-feed.test.ts
```

Expected: PASS.

- [x] **Step 6: Rewrite the legacy shell**

Replace `hooks/posts/usePostsFeed.ts` entirely with the shell — same exported call surface as before:

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { postStateAtom } from "@/atoms/postsAtom";
import { Post } from "@/types/post";
import { getPostsAction } from "@/app/actions/reads";
import type { PostCursor } from "@/lib/posts/getPosts";
import { keys } from "@/lib/queries/keys";
import useCustomToast from "../useCustomToast";

type UsePostsFeedProps = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

const usePostsFeed = ({
  communityId,
  communityIds,
  isGenericHome,
}: UsePostsFeedProps) => {
  const setPostStateValue = useSetAtom(postStateAtom);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<PostCursor>(null);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [accumulated, setAccumulated] = useState<Post[]>([]);
  const showToast = useCustomToast();

  const scope = { communityId, communityIds, isGenericHome };

  const fetchPosts = useCallback(
    async (initial = false) => {
      if (loading) return;
      if (!initial && noMorePosts) return;
      if (!initial && !lastVisible) return;

      setLoading(true);
      try {
        const cursor: PostCursor = initial ? null : lastVisible;
        const result = await queryClient.fetchQuery({
          queryKey: keys.posts.feed({ scope, cursor }),
          queryFn: () =>
            getPostsAction(
              scope.communityId,
              scope.communityIds,
              scope.isGenericHome,
              cursor,
            ),
        });
        const { posts, newLastVisible } = result;

        if (posts.length < 10) setNoMorePosts(true);
        if (newLastVisible) setLastVisible(newLastVisible);
        else if (initial) setNoMorePosts(true);

        const next = initial
          ? (posts as Post[])
          : [...accumulated, ...(posts as Post[])];
        setAccumulated(next);
        setPostStateValue((prev) => ({ ...prev, posts: next }));
      } catch (error) {
        console.log("Error: fetchPosts", error);
        showToast({
          title: "Could not Fetch Posts",
          description: "There was an error fetching posts",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      noMorePosts,
      lastVisible,
      queryClient,
      accumulated,
      scope.communityId,
      scope.communityIds,
      scope.isGenericHome,
      setPostStateValue,
      showToast,
    ],
  );

  useEffect(() => {
    setNoMorePosts(false);
    setLastVisible(null);
    setAccumulated([]);
    setPostStateValue((prev) => ({ ...prev, posts: [] }));

    return () => {
      setPostStateValue((prev) => ({ ...prev, posts: [] }));
    };
  }, [communityId, isGenericHome, setPostStateValue]);

  return {
    loading,
    fetchPosts,
    noMorePosts,
  };
};

export default usePostsFeed;
```

Note: this shell still uses `useEffect` to **reset paging state on scope change** — that's UI state, not a server fetch, and `react-hooks/set-state-in-effect` does not flag it (it's resetting client state in response to a prop change). The `// eslint-disable-next-line react-hooks/set-state-in-effect -- ... TanStack Query migration tracked separately` suppression that previously sat above this block **is removed**.

- [x] **Step 7: Verify lint suppression removal + types**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm grep "TanStack Query migration tracked separately" hooks/posts/usePostsFeed.ts
```

(Use ripgrep equivalent on your shell.) Expected: zero matches in this file.

- [x] **Step 8: Smoke test in the browser**

Reload http://localhost:3000 and scroll the home feed. Expect: posts load, "Load more" works, no console errors.

- [x] **Step 9: Commit**

```bash
git add lib/queries/keys.ts lib/queries/posts/use-posts-feed.ts hooks/posts/usePostsFeed.ts __tests__/lib/queries/posts/use-posts-feed.test.ts __tests__/lib/queries/keys.test.ts
git commit -m "feat(queries): usePostsFeedQuery + delegating shell"
```

---

## Task 3: Migrate `usePostVoteSync` (current-user vote list for a community)

**Files:**
- Create: `lib/queries/posts/use-post-votes.ts`
- Modify (rewrite): `hooks/posts/usePostVoteSync.ts`

Today `usePostVoteSync` is called for its side effect: it pulls the user's votes for the current community and writes them into `postStateAtom.postVotes`. After C2 the query is the source of truth; the shell mirrors into the dying atom until Task 15.

- [x] **Step 1: Write the query primitive**

Create `lib/queries/posts/use-post-votes.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunityPostVotesAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { PostVote } from "@/types/post";

export function useCommunityPostVotesQuery({
  communityId,
  enabled = true,
}: {
  communityId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery<PostVote[]>({
    queryKey: keys.posts.votes(communityId ?? ""),
    queryFn: () => getCommunityPostVotesAction(communityId!) as Promise<PostVote[]>,
    enabled: enabled && !!communityId,
  });
}
```

- [x] **Step 2: Rewrite the shell**

Replace `hooks/posts/usePostVoteSync.ts`:

```ts
"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { Post, PostVote } from "@/types/post";
import { useCommunityPostVotesQuery } from "@/lib/queries/posts/use-post-votes";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

const usePostVoteSync = (setPostStateValue: SetPostState) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const currentCommunity = useAtomValue(communityStateAtom).currentCommunity;
  const communityId = currentCommunity?.id;

  const { data: postVotes } = useCommunityPostVotesQuery({
    communityId,
    enabled: !!user && !!communityId,
  });

  useEffect(() => {
    setPostStateValue((prev) => ({
      ...prev,
      postVotes: !user || !communityId ? [] : (postVotes ?? []),
    }));
  }, [user, communityId, postVotes, setPostStateValue]);
};

export default usePostVoteSync;
```

The remaining `useEffect` exists solely to **mirror** query result + auth state into the dying `postStateAtom.postVotes`. It vanishes in Task 15 when the field is removed and consumers read `postVotes` directly from the query.

- [x] **Step 3: Run types + smoke**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 4: Commit**

```bash
git add lib/queries/posts/use-post-votes.ts hooks/posts/usePostVoteSync.ts
git commit -m "feat(queries): useCommunityPostVotesQuery + mirror shell"
```

---

## Task 4: Migrate `useSavedPosts` (read portion)

**Files:**
- Create: `lib/queries/posts/use-saved-posts.ts`
- Modify: `hooks/posts/useSavedPosts.tsx`

C2 only migrates the **read** half (`fetchSavedPosts` → query). The three mutations (`onSavePost`, `onRemoveSavedPost`, `isPostSaved`) stay closure-style until C3 — they continue reading and writing the dying `savedPostStateAtom`. This is the cleanest split given the choice locked in upfront (read in C2, mutate in C3).

- [x] **Step 1: Write the query primitive**

Create `lib/queries/posts/use-saved-posts.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSavedPostsAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import { useSession } from "@/lib/auth-client";

export function useSavedPostsQuery() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: keys.posts.saved(userId ?? ""),
    queryFn: () => getSavedPostsAction(),
    enabled: !!userId,
  });
}
```

- [x] **Step 2: Rewrite the read portion of the shell**

Edit `hooks/posts/useSavedPosts.tsx`. Replace the `fetchSavedPosts` function and the `loading` state with a delegation to the query; keep `onSavePost`, `onRemoveSavedPost`, `isPostSaved` as-is (they remain closures that read/write the atom until C3). Whole-file replacement:

```tsx
"use client";

import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { useAtom } from "jotai";
import { useEffect } from "react";
import useCustomToast from "../useCustomToast";
import {
  savePostAction,
  unsavePostAction,
} from "@/app/actions/posts";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";

const useSavedPosts = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [savedPostState, setSavedPostState] = useAtom(savedPostStateAtom);
  const showToast = useCustomToast();

  const savedQuery = useSavedPostsQuery();
  const loading = savedQuery.isLoading;

  useEffect(() => {
    if (!user) {
      setSavedPostState((prev) => ({ ...prev, savedPosts: [] }));
      return;
    }
    if (savedQuery.data) {
      setSavedPostState((prev) => ({ ...prev, savedPosts: savedQuery.data }));
    }
  }, [user, savedQuery.data, setSavedPostState]);

  const fetchSavedPosts = async () => {
    await savedQuery.refetch();
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      const isSaved = savedPostState.savedPosts.find(
        (item) => item.postId === post.id,
      );
      if (isSaved) {
        await unsavePostAction(post.id!);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
        }));
        showToast({ title: "Post removed from saved", status: "success" });
      } else {
        const newSavedPost = await savePostAction(post);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: [...prev.savedPosts, newSavedPost],
        }));
        showToast({ title: "Post saved", status: "success" });
      }
    } catch (error: any) {
      console.log("onSavePost error", error);
      showToast({
        title: "Error saving post",
        description: error.message,
        status: "error",
      });
    }
  };

  const onRemoveSavedPost = async (postId: string) => {
    if (!user) return;
    try {
      await unsavePostAction(postId);
      setSavedPostState((prev) => ({
        ...prev,
        savedPosts: prev.savedPosts.filter((item) => item.postId !== postId),
      }));
      showToast({ title: "Post removed from saved", status: "success" });
    } catch (error: any) {
      console.log("onRemoveSavedPost error", error);
      showToast({
        title: "Error removing saved post",
        description: error.message,
        status: "error",
      });
    }
  };

  const isPostSaved = (postId: string) =>
    !!savedPostState.savedPosts.find((item) => item.postId === postId);

  return {
    savedPostState,
    setSavedPostState,
    onSavePost,
    onRemoveSavedPost,
    isPostSaved,
    fetchSavedPosts,
    loading,
  };
};

export default useSavedPosts;
```

- [x] **Step 3: Verify types + smoke**

```bash
pnpm typecheck
```

Expected: clean.

Smoke: open a community feed while signed in, hit "save" on a post, refresh — saved state should persist (mutation still hits action; new query rehydrates).

- [x] **Step 4: Commit**

```bash
git add lib/queries/posts/use-saved-posts.ts hooks/posts/useSavedPosts.tsx
git commit -m "feat(queries): useSavedPostsQuery + read-side shell"
```

---

## Task 5: Add `usePostQuery` (post detail read — no current hook)

**Files:**
- Create: `lib/queries/posts/use-post.ts`

There's no current hook fetching a single post on the client — `app/community/[communityId]/comments/[pid]/page.tsx` does an SSR fetch and passes the post as a prop. C2 lands the client query so C3 mutations have a target to invalidate and so post-detail refetches don't require a full route reload.

- [x] **Step 1: Write the primitive**

Create `lib/queries/posts/use-post.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function usePostQuery({
  postId,
  enabled = true,
}: {
  postId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: keys.posts.detail(postId),
    queryFn: () => getPostAction(postId),
    enabled: enabled && !!postId,
  });
}
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean (no consumers yet — wired in Task 13's HydrationBoundary task).

- [x] **Step 3: Commit**

```bash
git add lib/queries/posts/use-post.ts
git commit -m "feat(queries): usePostQuery"
```

---

## Task 6: Migrate `useCommunitiesFeed` (cursor-paged community discovery)

**Files:**
- Create: `lib/queries/community/use-communities.ts`
- Modify (rewrite): `hooks/community/useCommunitiesFeed.ts`

Same paged-feed pattern as Task 2. The query holds one page keyed by `{ limit, cursor }`; the shell accumulates pages in component-local `useState` and preserves the legacy `{ communities, loading, fetchCommunities, noMoreCommunities }` surface.

- [x] **Step 1: Add the community-feed key**

Open `lib/queries/keys.ts` and replace `community.list` to take a page cursor:

```ts
community: {
  all: ["community"] as const,
  list: (args: { limit: number; cursor: unknown }) =>
    ["community", "list", args] as const,
  detail: (id: string) => ["community", "detail", id] as const,
  snippets: (userId: string) => ["community", "snippets", userId] as const,
  members: (id: string) => ["community", "members", id] as const,
  admins: (id: string) => ["community", "admins", id] as const,
},
```

- [x] **Step 2: Write the primitive**

Create `lib/queries/community/use-communities.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunitiesAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { CommunityCursor } from "@/lib/community/getCommunities";

export function useCommunitiesQuery({
  limit,
  cursor,
  enabled = true,
}: {
  limit: number;
  cursor: CommunityCursor;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: keys.community.list({ limit, cursor }),
    queryFn: () => getCommunitiesAction(limit, cursor),
    enabled,
  });
}
```

- [ ] **Step 3: Rewrite the legacy shell**

Replace `hooks/community/useCommunitiesFeed.ts`:

```ts
"use client";

import useCustomToast from "@/hooks/useCustomToast";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Community } from "@/types/community";
import { getCommunitiesAction } from "@/app/actions/reads";
import type { CommunityCursor } from "@/lib/community/getCommunities";
import { keys } from "@/lib/queries/keys";

type UseCommunitiesFeedProps = {
  limitValue?: number;
  isPagination?: boolean;
};

const useCommunitiesFeed = ({
  limitValue = 10,
  isPagination = false,
}: UseCommunitiesFeedProps) => {
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lastVisible, setLastVisible] = useState<CommunityCursor>(null);
  const [noMoreCommunities, setNoMoreCommunities] = useState(false);
  const showToast = useCustomToast();
  const queryClient = useQueryClient();

  const fetchCommunities = useCallback(
    async (initial = false) => {
      if (loading) return;
      setLoading(true);
      try {
        if (!initial && (!lastVisible || !isPagination)) {
          setLoading(false);
          return;
        }
        const cursor: CommunityCursor = initial ? null : lastVisible;
        const { communities: fetched, newLastVisible } =
          await queryClient.fetchQuery({
            queryKey: keys.community.list({ limit: limitValue, cursor }),
            queryFn: () => getCommunitiesAction(limitValue, cursor),
          });

        if (fetched.length < limitValue) setNoMoreCommunities(true);
        if (newLastVisible) setLastVisible(newLastVisible);

        setCommunities((prev) =>
          initial ? (fetched as Community[]) : [...prev, ...(fetched as Community[])],
        );
      } catch (error) {
        console.log("Error: fetchCommunities", error);
        showToast({
          title: "Could not Find Communities",
          description: "There was an error getting communities",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, lastVisible, isPagination, limitValue, queryClient, showToast],
  );

  useEffect(() => {
    fetchCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    communities,
    loading,
    fetchCommunities,
    noMoreCommunities,
  };
};

export default useCommunitiesFeed;
```

The `// eslint-disable-next-line react-hooks/set-state-in-effect -- ... TanStack Query migration tracked separately` previously above the `useEffect` is removed. The remaining `exhaustive-deps` suppression is unrelated and stays.

- [x] **Step 4: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 5: Smoke**

Reload the home/community-discovery view and confirm the list renders + pagination works.

- [x] **Step 6: Commit**

```bash
git add lib/queries/keys.ts lib/queries/community/use-communities.ts hooks/community/useCommunitiesFeed.ts
git commit -m "feat(queries): useCommunitiesQuery + delegating shell"
```

---

## Task 7: `useCommunityDataQuery` (community detail read)

**Files:**
- Create: `lib/queries/community/use-community-data.ts`
- Create: `__tests__/lib/queries/community/use-community-data.test.ts`

There's no current client read hook for community-by-id (server components fetch and pass as prop). C2 adds the query so post-mutation invalidation in C3 can refresh community-detail consumers without a route reload.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-community-data.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

vi.mock("@/app/actions/reads", () => ({
  getCommunityDataAction: vi.fn(async () => ({
    id: "c1",
    displayName: "Test",
  })),
}));

import { getCommunityDataAction } from "@/app/actions/reads";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

beforeEach(() => vi.clearAllMocks());

describe("useCommunityDataQuery", () => {
  it("returns community data for the id", async () => {
    const { result } = renderHook(
      () => useCommunityDataQuery({ communityId: "c1" }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>).container.parentElement
            ? renderWithProviders(<>{children}</>).baseElement
            : (<>{children}</> as any),
      },
    );
    await waitFor(() => expect(result.current.data?.id).toBe("c1"));
    expect(getCommunityDataAction).toHaveBeenCalledWith("c1");
  });
});
```

If `renderWithProviders` only returns `render` output, adapt the wrapper: re-export a `Providers` component from the helper for use with `renderHook`'s `wrapper` option. Alternatively, simplify by calling `useCommunityDataQuery` inside a component rendered with `renderWithProviders` and asserting via DOM.

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-community-data.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-community-data.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunityDataAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useCommunityDataQuery({
  communityId,
  enabled = true,
}: {
  communityId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: keys.community.detail(communityId),
    queryFn: () => getCommunityDataAction(communityId),
    enabled: enabled && !!communityId,
    staleTime: 60_000,
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-community-data.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-community-data.ts __tests__/lib/queries/community/use-community-data.test.ts
git commit -m "feat(queries): useCommunityDataQuery"
```

---

## Task 8: Migrate `useCommunitySnippets`

**Files:**
- Create: `lib/queries/community/use-community-snippets.ts`
- Modify (rewrite): `hooks/community/useCommunitySnippets.ts`

- [x] **Step 1: Write the primitive**

Create `lib/queries/community/use-community-snippets.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunitySnippetsAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export function useCommunitySnippetsQuery() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: keys.community.snippets(userId ?? ""),
    queryFn: () => getCommunitySnippetsAction(),
    enabled: !!userId,
  });
}
```

- [x] **Step 2: Rewrite the shell**

Replace `hooks/community/useCommunitySnippets.ts`:

```ts
"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import useCustomToast from "../useCustomToast";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";

export const useCommunitySnippets = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();

  const query = useCommunitySnippetsQuery();

  useEffect(() => {
    if (!user) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [],
        snippetFetched: false,
      }));
      return;
    }
    if (query.data) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: query.data,
        snippetFetched: true,
      }));
    }
    if (query.error) {
      showToast({
        title: "Subscriptions not Found",
        description: "There was an error fetching your subscriptions",
        status: "error",
      });
    }
  }, [user, query.data, query.error, setCommunityStateValue, showToast]);

  return {
    loading: query.isLoading,
    error: query.error ? String(query.error) : "",
  };
};
```

The `// eslint-disable-next-line react-hooks/set-state-in-effect -- ... TanStack Query migration tracked separately` is removed. The remaining `useEffect` only mirrors auth state + query result into the dying atom; it carries no suppression because it isn't a fetch.

- [x] **Step 3: Verify types + smoke**

```bash
pnpm typecheck
```

Expected: clean.

Smoke: sign in, navigate around — your community-snippet menu should populate.

- [x] **Step 4: Commit**

```bash
git add lib/queries/community/use-community-snippets.ts hooks/community/useCommunitySnippets.ts
git commit -m "feat(queries): useCommunitySnippetsQuery + mirror shell"
```

---

## Task 9: Migrate `useCommunityMembers`

**Files:**
- Create: `lib/queries/community/use-community-members.ts`
- Modify (rewrite): `hooks/community/useCommunityMembers.ts`

Today the hook exposes `{ members, loading, error, loadMembers }`. Members are fetched on demand (caller invokes `loadMembers(id)`). After C2 the query handles the fetch and the shell exposes the same on-demand surface via a parameterized hook.

- [x] **Step 1: Write the primitive**

Create `lib/queries/community/use-community-members.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useCommunityMembersQuery({
  communityId,
  enabled = true,
}: {
  communityId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: keys.community.members(communityId),
    queryFn: () => fetchCommunityMembersAction(communityId),
    enabled: enabled && !!communityId,
  });
}
```

- [x] **Step 2: Rewrite the shell**

Replace `hooks/community/useCommunityMembers.ts`:

```ts
"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { CommunityMember } from "@/types/communityMember";
import { keys } from "@/lib/queries/keys";

const useCommunityMembers = () => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadMembers = useCallback(
    async (communityId: string) => {
      setLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: keys.community.members(communityId),
          queryFn: () => fetchCommunityMembersAction(communityId),
        });
        setMembers(result);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load community members", err);
        setMembers([]);
        setError(err?.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    },
    [queryClient],
  );

  return {
    members,
    loading,
    error,
    loadMembers,
  };
};

export default useCommunityMembers;
```

The hook's public surface is unchanged; the only behavioural difference is that repeat calls for the same `communityId` within `gcTime` hit the cache.

- [x] **Step 3: Verify types + commit**

```bash
pnpm typecheck
```

Expected: clean.

```bash
git add lib/queries/community/use-community-members.ts hooks/community/useCommunityMembers.ts
git commit -m "feat(queries): useCommunityMembersQuery + delegating shell"
```

---

## Task 10: Migrate `useAdminList` + add `useCommunityAdminsQuery`

**Files:**
- Create: `lib/queries/community/use-community-admins.ts`
- Modify (rewrite): `hooks/admin/useAdminList.ts`

Note: the current hook lives under `hooks/admin/` but the **query** belongs under `lib/queries/community/` per spec §4.1 (`use-community-admins.ts`), because admins are a property of a community, not of the admin tooling.

- [x] **Step 1: Write the primitive**

Create `lib/queries/community/use-community-admins.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { AdminUser } from "@/types/adminUser";
import { keys } from "@/lib/queries/keys";

export function useCommunityAdminsQuery({
  communityId,
  enabled = true,
}: {
  communityId: string;
  enabled?: boolean;
}) {
  return useQuery<AdminUser[]>({
    queryKey: keys.community.admins(communityId),
    queryFn: async () => {
      const result = await fetchCommunityAdminsAction(communityId);
      return result.map((m) => ({
        uid: m.id,
        email: m.email,
        displayName: m.displayName ?? undefined,
      }));
    },
    enabled: enabled && !!communityId,
    staleTime: 0,
  });
}
```

- [x] **Step 2: Rewrite the shell**

Replace `hooks/admin/useAdminList.ts`:

```ts
"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminUser } from "@/types/adminUser";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

const useAdminList = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const loadAdmins = useCallback(
    async (communityId: string) => {
      setLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: keys.community.admins(communityId),
          queryFn: async () => {
            const r = await fetchCommunityAdminsAction(communityId);
            return r.map((m) => ({
              uid: m.id,
              email: m.email,
              displayName: m.displayName ?? undefined,
            }));
          },
        });
        setAdmins(result);
      } catch (error: any) {
        console.error("Error fetching admins", error);
        setAdmins([]);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [queryClient],
  );

  return { admins, setAdmins, loading, loadAdmins };
};

export default useAdminList;
```

- [x] **Step 3: Verify types + commit**

```bash
pnpm typecheck
```

Expected: clean.

```bash
git add lib/queries/community/use-community-admins.ts hooks/admin/useAdminList.ts
git commit -m "feat(queries): useCommunityAdminsQuery + delegating shell"
```

---

## Task 11: Migrate `useAdminSearch` (debounced user search + single user lookup)

**Files:**
- Create: `lib/queries/admin/use-admin-search.ts`
- Create: `__tests__/lib/queries/admin/use-admin-search.test.ts`
- Modify (rewrite): `hooks/admin/useAdminSearch.ts`

Today this hook exposes two imperatively-called functions (`searchUsers`, `findUser`). After C2 there are two queries: `useAdminSearchUsersQuery(q)` (debounced search, enabled on non-empty term) and `useAdminFindUserQuery(email)` (single-shot lookup). The shell preserves the imperative `{ searchUsers, findUser }` surface for unchanged call sites.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/admin/use-admin-search.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

vi.mock("@/app/actions/reads", () => ({
  searchUsersByEmailAction: vi.fn(async (q: string) => [
    { id: "u1", email: `${q}@x.com` },
  ]),
  findUserByEmailAction: vi.fn(async (e: string) => ({ id: "u2", email: e })),
}));

import { useAdminSearchUsersQuery } from "@/lib/queries/admin/use-admin-search";

beforeEach(() => vi.clearAllMocks());

describe("useAdminSearchUsersQuery", () => {
  it("returns matches for a non-empty query", async () => {
    const { result } = renderHook(
      () => useAdminSearchUsersQuery({ query: "alice" }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>).baseElement as any,
      },
    );
    await waitFor(() => expect(result.current.data?.[0]?.email).toBe("alice@x.com"));
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/admin/use-admin-search.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitives**

Create `lib/queries/admin/use-admin-search.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchUsersByEmailAction,
  findUserByEmailAction,
} from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useAdminSearchUsersQuery({
  query,
  enabled = true,
}: {
  query: string;
  enabled?: boolean;
}) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: keys.admin.search(trimmed),
    queryFn: () => searchUsersByEmailAction(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: 60_000,
  });
}

export function useAdminFindUserQuery({
  email,
  enabled = true,
}: {
  email: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [...keys.admin.search(email), "exact"] as const,
    queryFn: () => findUserByEmailAction(email),
    enabled: enabled && email.length > 0,
    staleTime: 60_000,
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/admin/use-admin-search.test.ts
```

Expected: PASS.

- [x] **Step 5: Rewrite the shell**

Replace `hooks/admin/useAdminSearch.ts` — preserves the imperative `{ searchUsers, findUser }` surface by routing through the QueryClient:

```ts
"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  findUserByEmailAction,
  searchUsersByEmailAction,
} from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

const useAdminSearch = () => {
  const queryClient = useQueryClient();

  const searchUsers = useCallback(
    async (emailQuery: string) => {
      const trimmed = emailQuery.trim();
      if (!trimmed) return [];
      try {
        return await queryClient.fetchQuery({
          queryKey: keys.admin.search(trimmed),
          queryFn: () => searchUsersByEmailAction(trimmed),
        });
      } catch (error) {
        console.error("Error searching users", error);
        return [];
      }
    },
    [queryClient],
  );

  const findUser = useCallback(
    async (email: string) => {
      try {
        return await queryClient.fetchQuery({
          queryKey: [...keys.admin.search(email), "exact"] as const,
          queryFn: () => findUserByEmailAction(email),
        });
      } catch (error) {
        console.error("Error finding user", error);
        throw error;
      }
    },
    [queryClient],
  );

  return { searchUsers, findUser };
};

export default useAdminSearch;
```

- [x] **Step 6: Verify types + commit**

```bash
pnpm typecheck
```

Expected: clean.

```bash
git add lib/queries/admin/ hooks/admin/useAdminSearch.ts __tests__/lib/queries/admin/
git commit -m "feat(queries): useAdminSearchUsersQuery + useAdminFindUserQuery + shell"
```

---

## Task 12: Migrate `useCommentList`

**Files:**
- Create: `lib/queries/comments/use-comments.ts`
- Create: `__tests__/lib/queries/comments/use-comments.test.ts`
- Modify (rewrite): `hooks/comments/useCommentList.ts`

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/comments/use-comments.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

vi.mock("@/app/actions/reads", () => ({
  getCommentsAction: vi.fn(async () => [
    { id: "cm1", postId: "p1", text: "hi" },
  ]),
}));

import { getCommentsAction } from "@/app/actions/reads";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

beforeEach(() => vi.clearAllMocks());

describe("useCommentsForPostQuery", () => {
  it("fetches comments for a post id", async () => {
    const { result } = renderHook(
      () => useCommentsForPostQuery({ postId: "p1" }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>).baseElement as any,
      },
    );
    await waitFor(() => expect(result.current.data?.[0]?.id).toBe("cm1"));
    expect(getCommentsAction).toHaveBeenCalledWith("p1");
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/comments/use-comments.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/comments/use-comments.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommentsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { Comment } from "@/types/comment";

export function useCommentsForPostQuery({
  postId,
  enabled = true,
}: {
  postId: string;
  enabled?: boolean;
}) {
  return useQuery<Comment[]>({
    queryKey: keys.comments.forPost(postId),
    queryFn: () => getCommentsAction(postId) as Promise<Comment[]>,
    enabled: enabled && !!postId,
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/comments/use-comments.test.ts
```

Expected: PASS.

- [x] **Step 5: Rewrite the shell**

Replace `hooks/comments/useCommentList.ts`:

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const postId = selectedPost?.id ?? "";

  const query = useCommentsForPostQuery({
    postId,
    enabled: !!selectedPost,
  });

  useEffect(() => {
    if (query.data) setComments(query.data);
    if (query.error) {
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    }
  }, [query.data, query.error, showToast]);

  const loadComments = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    comments,
    setComments,
    commentFetchLoading: query.isLoading,
    loadComments,
  };
};

export default useCommentList;
```

The `// eslint-disable-next-line react-hooks/set-state-in-effect -- ... TanStack Query migration tracked separately` is removed. The remaining `useEffect` only mirrors query result into local state for callers that mutate `comments` via `setComments` (e.g. optimistic insert in the create-comment flow); the mirror is *transitional* and disappears in C3 when create/delete-comment mutations land with proper invalidation.

- [x] **Step 6: Verify types + commit**

```bash
pnpm typecheck
```

Expected: clean.

```bash
git add lib/queries/comments/ __tests__/lib/queries/comments/ hooks/comments/useCommentList.ts
git commit -m "feat(queries): useCommentsForPostQuery + delegating shell"
```

---

## Task 13: Migrate `useSearch` (debounced multi-result search)

**Files:**
- Create: `lib/queries/search/use-search.ts`
- Create: `__tests__/lib/queries/search/use-search.test.ts`
- Modify (rewrite): `hooks/useSearch.tsx`

The current hook implements a 250ms debounce inline. After C2 the debounce lives in the shell (debounce is UI concern, not server-state concern); the query is plain. Empty-term path: query is disabled.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/search/use-search.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

vi.mock("@/app/actions/reads", () => ({
  getSearchDataAction: vi.fn(async (q: string) => ({
    communities: [{ id: `c-${q}` }],
    posts: [{ id: `p-${q}` }],
  })),
}));

import { useSearchQuery } from "@/lib/queries/search/use-search";

beforeEach(() => vi.clearAllMocks());

describe("useSearchQuery", () => {
  it("returns results for a non-empty term", async () => {
    const { result } = renderHook(
      () => useSearchQuery({ term: "react" }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>).baseElement as any,
      },
    );
    await waitFor(() =>
      expect(result.current.data?.communities?.[0]?.id).toBe("c-react"),
    );
  });

  it("is disabled for empty term", async () => {
    const { result } = renderHook(
      () => useSearchQuery({ term: "   " }),
      {
        wrapper: ({ children }) =>
          renderWithProviders(<>{children}</>).baseElement as any,
      },
    );
    // disabled queries stay in idle/loading-false state
    expect(result.current.fetchStatus).toBe("idle");
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/search/use-search.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/search/use-search.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSearchDataAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useSearchQuery({
  term,
  enabled = true,
}: {
  term: string;
  enabled?: boolean;
}) {
  const trimmed = term.trim();
  return useQuery({
    queryKey: keys.search(trimmed),
    queryFn: () => getSearchDataAction(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: 60_000,
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/search/use-search.test.ts
```

Expected: PASS.

- [x] **Step 5: Rewrite the shell**

Replace `hooks/useSearch.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { useSearchQuery } from "@/lib/queries/search/use-search";

const EMPTY = { communities: [] as Community[], posts: [] as Post[] };

const useSearch = (searchTerm: string) => {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setDebounced("");
      return;
    }
    const handle = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const query = useSearchQuery({ term: debounced });

  return {
    results: query.data ?? EMPTY,
    loading: query.isFetching && debounced.length > 0,
  };
};

export default useSearch;
```

The `// eslint-disable-next-line react-hooks/set-state-in-effect -- reset on empty-term prop change; TanStack Query migration tracked separately` is removed. The remaining `useEffect` is the debounce timer — it sets *UI* state (the debounced search term), and that's the canonical use of `set-state-in-effect` (no lint suppression needed since it's not a fetch).

- [x] **Step 6: Verify types + commit**

```bash
pnpm typecheck
```

Expected: clean.

```bash
git add lib/queries/search/ __tests__/lib/queries/search/ hooks/useSearch.tsx
git commit -m "feat(queries): useSearchQuery + debounced shell"
```

---

## Task 14: HydrationBoundary on the four SSR pages

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/community/[communityId]/page.tsx`
- Modify: `app/community/[communityId]/comments/[pid]/page.tsx`
- Modify: `app/community/[communityId]/submit/page.tsx`

Each SSR page prefetches the queries its client tree will read, wraps the client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`, and passes no other client-state via props for the prefetched data. Client hooks then pick up the warm cache on first paint without a refetch.

- [ ] **Step 1: Home page (`app/page.tsx`) — prefetch home feed**

Read the current file first to preserve any existing logic; modify the default export to wrap the existing client tree in HydrationBoundary. Insert (or replace the JSX return with) the pattern below. Adapt `<HomePageClient />` to whatever the current page's client component is named (it might be inlined as JSX — in that case move it to a named client component first and call that from inside the boundary).

```tsx
// app/page.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import { getPostsAction } from "@/app/actions/reads";
// ... existing imports

export default async function Home(/* existing args */) {
  const queryClient = getQueryClient();

  // Prefetch the generic-home first page so the client renders with warm cache.
  await queryClient.prefetchQuery({
    queryKey: keys.posts.feed({
      scope: { isGenericHome: true },
      cursor: null,
    }),
    queryFn: () => getPostsAction(undefined, undefined, true, null),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* existing client-tree JSX */}
    </HydrationBoundary>
  );
}
```

If the home page distinguishes signed-in (personalized) vs signed-out (generic) at the server, prefetch the appropriate `scope` accordingly — read session in the server component and switch.

- [ ] **Step 2: Community page (`app/community/[communityId]/page.tsx`) — prefetch community data + first feed page**

```tsx
// app/community/[communityId]/page.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import {
  getCommunityDataAction,
  getPostsAction,
} from "@/app/actions/reads";
// ... existing imports + CommunityClientPage

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: keys.community.detail(communityId),
      queryFn: () => getCommunityDataAction(communityId),
    }),
    queryClient.prefetchQuery({
      queryKey: keys.posts.feed({
        scope: { communityId },
        cursor: null,
      }),
      queryFn: () => getPostsAction(communityId, undefined, false, null),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CommunityClientPage communityId={communityId} />
    </HydrationBoundary>
  );
}
```

Adapt the params signature to whatever the current file uses (sync vs Promise-wrapped — Next 16 may have either depending on the route).

- [ ] **Step 3: Post detail page (`app/community/[communityId]/comments/[pid]/page.tsx`) — prefetch post + comments**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import {
  getCommentsAction,
  getPostAction,
} from "@/app/actions/reads";
// ... existing imports + PostClientPage

export default async function PostPage({
  params,
}: {
  params: Promise<{ communityId: string; pid: string }>;
}) {
  const { pid, communityId } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: keys.posts.detail(pid),
      queryFn: () => getPostAction(pid),
    }),
    queryClient.prefetchQuery({
      queryKey: keys.comments.forPost(pid),
      queryFn: () => getCommentsAction(pid),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostClientPage communityId={communityId} postId={pid} />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 4: Submit page (`app/community/[communityId]/submit/page.tsx`) — prefetch community data**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import { getCommunityDataAction } from "@/app/actions/reads";
// ... existing imports + SubmitPostClientPage

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: keys.community.detail(communityId),
    queryFn: () => getCommunityDataAction(communityId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubmitPostClientPage communityId={communityId} />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 5: Verify SSR hydration**

```bash
pnpm typecheck
```

Expected: clean.

Smoke each route in the browser:
1. http://localhost:3000/ — view source: the page HTML should embed dehydrated state for the home feed key. Open Network tab, hard-reload — there should be **no** `_next/action/...` call for the home feed on first paint (the client picks up the warm cache).
2. Repeat for `/community/<id>`, `/community/<id>/comments/<pid>`, `/community/<id>/submit`.

If a client hook still re-fetches on hydration, the queryKey computed client-side doesn't match what the server prefetched — log both keys, fix the mismatch (usually `scope` shape inconsistency).

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/community/[communityId]/page.tsx app/community/[communityId]/comments/[pid]/page.tsx app/community/[communityId]/submit/page.tsx
git commit -m "feat(ssr): HydrationBoundary + prefetch on four SSR routes"
```

---

## Task 15: Atom decomposition (uiAtom + delete dying atoms)

**Files:**
- Create: `atoms/uiAtom.ts`
- Delete: `atoms/postsAtom.ts`, `atoms/communitiesAtom.ts`, `atoms/savedPostsAtom.ts`, `atoms/directoryMenuAtom.ts`
- Modify: every consumer of the deleted atoms (consumer list discovered via grep in Step 1)

This is the destructive step. Before deleting an atom, every reader of its server-state fields must be switched to the corresponding query hook, and every reader of its UI-state fields must be switched to `uiAtom`. The shells we wrote in Tasks 3, 4, 8 still mirror into the dying atoms — those mirror lines also go away here.

- [ ] **Step 1: Inventory atom consumers**

Run from project root:

```bash
pnpm grep -l "from \"@/atoms/postsAtom\"" .
pnpm grep -l "from \"@/atoms/communitiesAtom\"" .
pnpm grep -l "from \"@/atoms/savedPostsAtom\"" .
pnpm grep -l "from \"@/atoms/directoryMenuAtom\"" .
```

Record the file list. Each file is touched in this task.

- [x] **Step 2: Create `atoms/uiAtom.ts`**

```ts
// atoms/uiAtom.ts
import { atom } from "jotai";
import { Post } from "@/types/post";
import { Community } from "@/types/community";

export type DirectoryMenuItem = {
  displayText: string;
  link: string;
  icon: any;
  iconColor: string;
  imageURL?: string;
  communityId?: string;
};

export interface UiState {
  selectedPost: Post | null;
  currentCommunity: Community | null;
  directoryMenu: {
    isOpen: boolean;
    selectedMenuItem: DirectoryMenuItem | null;
  };
}

const defaultUiState: UiState = {
  selectedPost: null,
  currentCommunity: null,
  directoryMenu: { isOpen: false, selectedMenuItem: null },
};

export const uiAtom = atom<UiState>(defaultUiState);
```

If the current `directoryMenuAtom` has a different shape than the one above, mirror the current shape exactly — open the file and copy the type. Same for `currentCommunity` derived from `communityStateAtom`. The goal is **zero behavior change** in UI state — only relocation.

- [ ] **Step 3: Migrate every `postStateAtom` consumer**

For each file in the Step 1 inventory under `postsAtom`:
- replace `useAtom(postStateAtom)` / `useAtomValue(postStateAtom).selectedPost` with `useAtom(uiAtom)` selecting `selectedPost`, OR use Jotai's focus pattern if the consumer needs reactive narrowing
- replace `prev.posts` / `prev.postVotes` reads with the corresponding query hook (`usePostsFeedQuery`, `useCommunityPostVotesQuery`)
- delete any mirror-write paths from Tasks 2 and 3 — the shells no longer write `posts` / `postVotes` into Jotai (those fields don't exist on `uiAtom`)

After all consumers are switched, in `hooks/posts/usePostsFeed.ts` and `hooks/posts/usePostVoteSync.ts`, remove the lines that call `setPostStateValue((prev) => ({ ...prev, posts: ... }))` and `setPostStateValue((prev) => ({ ...prev, postVotes: ... }))`. They become no-ops.

Then delete the file:

```bash
git rm atoms/postsAtom.ts
```

- [ ] **Step 4: Migrate every `communityStateAtom` consumer**

For each file in the Step 1 inventory under `communitiesAtom`:
- `mySnippets` / `snippetFetched` readers → switch to `useCommunitySnippetsQuery` (read `query.data`, `query.isLoading`, `!!query.data` respectively)
- `currentCommunity` readers → switch to `useAtomValue(uiAtom).currentCommunity`
- `currentCommunity` writers (page-level "set current community on mount" effects) → switch to `useSetAtom(uiAtom)` and update via `(prev) => ({ ...prev, currentCommunity: ... })`

After all consumers are switched, in `hooks/community/useCommunitySnippets.ts`, remove the `setCommunityStateValue` mirror block; the shell becomes a passthrough returning `{ loading, error }`.

Then delete the file:

```bash
git rm atoms/communitiesAtom.ts
```

If a `hooks/community/useCommunityState.ts` consumer remains (it reads `communityStateAtom` directly), rewrite it to read from `uiAtom.currentCommunity` and from `useCommunitySnippetsQuery` as appropriate, or delete the hook and migrate its callers.

- [ ] **Step 5: Migrate every `savedPostStateAtom` consumer**

For each file in the Step 1 inventory under `savedPostsAtom`:
- read paths (`isPostSaved`, list rendering) → switch to `useSavedPostsQuery` (`query.data ?? []`)
- write paths in `useSavedPosts.tsx` (`onSavePost`, `onRemoveSavedPost`) — these are mutations that C3 will model with proper invalidation. For now, since the atom is going away, change them to call `queryClient.setQueryData(keys.posts.saved(userId), ...)` for optimistic update + `queryClient.invalidateQueries({ queryKey: keys.posts.saved(userId) })` after the action. This keeps the read consumers reactive without the atom.

Then delete the file:

```bash
git rm atoms/savedPostsAtom.ts
```

- [ ] **Step 6: Migrate every `directoryMenuAtom` consumer**

For each file in the Step 1 inventory under `directoryMenuAtom`:
- replace `useAtom(directoryMenuStateAtom)` (or whatever the export is) with `useAtom(uiAtom)` and read/write `directoryMenu`
- preserve the shape exactly — if the existing consumer destructures `{ isOpen, selectedMenuItem }`, keep the same field names on `uiAtom.directoryMenu`

Then delete the file:

```bash
git rm atoms/directoryMenuAtom.ts
```

- [ ] **Step 7: Verify atom directory shape**

```bash
ls atoms/
```

Expected output: `uiAtom.ts` only.

- [ ] **Step 8: Verify no orphaned imports**

```bash
pnpm grep -l "atoms/postsAtom\|atoms/communitiesAtom\|atoms/savedPostsAtom\|atoms/directoryMenuAtom" .
```

Expected: zero matches.

- [ ] **Step 9: Full green gate**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm test
```

Expected: all green; new query tests pass.

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 10: Smoke all four routes in the browser**

Reload each of:
- `/`
- `/community/<id>`
- `/community/<id>/comments/<pid>`
- `/community/<id>/submit`

Expect: every page renders, posts/comments/community-data load, saved-post toggling still works, no console errors. If any page breaks, the consumer migration in Steps 3–6 missed something — fix and re-verify before committing.

- [ ] **Step 11: Commit**

```bash
git add atoms/uiAtom.ts
git add -A atoms/  # captures the deletes
git add hooks/
git add -A  # captures consumer files modified across the codebase
git commit -m "refactor: decompose server-state atoms; uiAtom holds UI state only"
```

If the diff is unusually large (>30 files), consider splitting into two commits — one per atom — but verify boot + typecheck after each.

---

## Task 16: Final green gate for C2

**Files:** none (verification only)

- [ ] **Step 1: Run the full check suite**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

All four must exit clean.

- [ ] **Step 2: Verify zero TanStack-tagged lint suppressions remain**

```bash
pnpm grep -n "TanStack Query migration tracked separately" .
```

Expected: zero matches across the repo.

- [ ] **Step 3: Verify zero fetch-in-effect patterns in migrated hooks**

```bash
pnpm grep -n "set-state-in-effect" hooks/
```

Expected: zero matches under `hooks/`. (Suppressions on UI-state effects, if any, should not carry the "TanStack Query migration tracked separately" tail comment.)

- [ ] **Step 4: Verify atoms folder contains exactly one file**

```bash
ls atoms/
```

Expected: `uiAtom.ts` only.

- [ ] **Step 5: Boot the dev server and walk the four routes**

If the dev server isn't already running:

```bash
pnpm dev
```

Walk `/`, `/community/<id>`, `/community/<id>/comments/<pid>`, `/community/<id>/submit` — confirm each loads with no console errors and Network panel shows server actions are deduped (one call per unique queryKey on first paint).

- [ ] **Step 6: Update the perf baseline doc's status**

Edit `docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md` and bump the status line:

```markdown
**Status:** C1 closed without browser measurements (C2 complete 2026-05-20) / re-measure (C4)
```

Add a one-line entry under the C1 closeout section:

```markdown
- 2026-05-20: C2 (reads + hydration + atom decomp) merged. C3 (mutations + invalidation) is next.
```

- [ ] **Step 7: Commit and close out C2**

```bash
git add docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md
git commit -m "docs: mark C2 complete in perf baseline status"
```

C2 is now ready to merge / hand off to C3. Open the PR with a summary referencing this plan; the C3 plan can be drafted once C2 is reviewed and merged.

---

## Out-of-scope reminder

Per spec §12, these are **not** in C2 and must not be added here:
- Mutation hooks (vote, create-post, comment, join-community, etc.) — **all** mutations land in C3
- `useInfiniteQuery` refactor of feed hooks — post-Phase-C
- Optimistic UI on the saved-posts toggle — the workaround in Task 15 Step 5 (setQueryData + invalidate) is the minimum needed to keep the UI reactive after atom deletion; proper optimistic UX is C3 / post-C3 polish
- Chakra → shadcn re-skin — Phase D

If during execution it becomes clear a mutation hook must land in C2 to unblock something (e.g. a consumer's only path to refresh a list is a mutation that doesn't exist yet), stop, document the dependency, and revisit the C2/C3 split before adding to this plan.
