# Phase C3 (Posts) — Mutations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the four posts-group mutation hooks (`usePostVote`, `useCreatePost`, `usePostDeletion`, `useSavedPosts.save/unsave`) to `useMutation` primitives under `lib/queries/posts/` with the invalidation contract from parent spec §6. After this PR, posts-group server-state changes flow through TanStack Query's mutation pipeline; consumers refresh via invalidation; component call sites are unchanged.

**Architecture:** Each mutation gets a primitive (`lib/queries/posts/use-<name>-mutation.ts`) owning the `useMutation` config (mutationFn + invalidations on onSuccess). The legacy hook under `hooks/posts/use<Name>.tsx` becomes a shell that calls `mutateAsync` and keeps its exported call surface (auth gating, toasts, router redirects, caller-supplied state updates stay in the shell). No `onMutate` optimistic cache writes; no `setQueryData` in shells. Mutations await success, then invalidate.

**Tech Stack:** TanStack Query v5 (`useMutation` + `invalidateQueries` predicate), Next 16 App Router, Vitest + happy-dom + Testing Library, pnpm. Tests reuse `__tests__/helpers/renderWithProviders.tsx` (added in C2 Task 1).

**Spec reference:** [docs/superpowers/specs/2026-05-20-forum-phase-c3-mutations-design.md](../specs/2026-05-20-forum-phase-c3-mutations-design.md) (modified C3 design); parent spec [2026-05-20-forum-phase-c-tanstack-query-design.md](../specs/2026-05-20-forum-phase-c-tanstack-query-design.md) §6 (invalidation map), §10 (testing strategy), §12 (optimistic deferred).

---

## Known limitations going in

These are inherited from parent spec §13 and the C2 deferral of `useInfiniteQuery`. They are NOT bugs introduced by this plan; document them so the smoke checklist sets correct expectations:

1. **Feed shell uses `fetchQuery`, not subscriptive `useQuery`.** Invalidating `posts.feed.*` will mark the cached page entries stale, so the *next* mount of `usePostsFeed` re-fetches. But the currently-mounted feed view's component-local accumulator (`accumulated: Post[]` inside `hooks/posts/usePostsFeed.ts`) does NOT auto-update. So "create post → see it at top of feed without refresh" only works if the create flow navigates to a new feed mount (it does — `router.back()` re-enters the previous page). Direct in-place feed refresh is post-C-phase work tied to the deferred `useInfiniteQuery` refactor.

2. **Optimistic cache writes are removed.** Today `useSavedPosts.onSavePost` and `usePostDeletion.onDeletePost` do `queryClient.setQueryData(...)` before awaiting the action — that's optimistic. Per spec §12 we hold the line on no optimistic in C3. UX: save toggle and delete-from-saved-list show one network round trip's worth of staleness. If this regresses noticeably, optimistic-vote / optimistic-save are tracked as post-Phase-C polish.

3. **`posts.votes` keyed by `communityId`.** Parent spec §6 keys it by `userId`. Actual code keys by `communityId` (see `lib/queries/keys.ts:14`). This plan invalidates the live key; revisiting the shape is tracked in the C3 spec §10.

---

## File Structure

**New primitives (`lib/queries/posts/`):**
- `lib/queries/posts/use-post-vote.ts` — `usePostVoteMutation`
- `lib/queries/posts/use-create-post.ts` — `useCreatePostMutation`
- `lib/queries/posts/use-delete-post.ts` — `useDeletePostMutation`
- `lib/queries/posts/use-saved-posts-mutation.ts` — `useSavePostMutation` + `useUnsavePostMutation`

**New tests (`__tests__/lib/queries/posts/`):**
- `__tests__/lib/queries/posts/use-post-vote.test.tsx`
- `__tests__/lib/queries/posts/use-create-post.test.tsx`
- `__tests__/lib/queries/posts/use-delete-post.test.tsx`
- `__tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx`

**Rewritten shells (`hooks/posts/`):**
- `hooks/posts/usePostVote.tsx`
- `hooks/posts/useCreatePost.ts`
- `hooks/posts/usePostDeletion.ts`
- `hooks/posts/useSavedPosts.tsx` (mutation half — read half stays as-is from C2)

---

## Task 1: `usePostVoteMutation` primitive

**Files:**
- Create: `lib/queries/posts/use-post-vote.ts`
- Create: `__tests__/lib/queries/posts/use-post-vote.test.tsx`

The mutation wraps `voteAction` and, on success, invalidates `posts.detail(post.id)`, every `posts.feed.*` key via predicate, and `posts.votes(communityId)`. It returns the action's `{ voteChange, newVote, voteIdToDelete }` payload so the shell can apply it to caller-supplied local state.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/posts/use-post-vote.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
  voteAction: vi.fn(async () => ({
    voteChange: 1,
    newVote: { id: "v1", postId: "p1", communityId: "c1", voteValue: 1, userId: "u1" },
    voteIdToDelete: null,
  })),
}));

import { voteAction } from "@/app/actions/posts";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("usePostVoteMutation", () => {
  it("calls voteAction and invalidates detail + feed + votes on success", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    client.setQueryData(keys.posts.detail("p1"), { id: "p1", title: "before" });
    client.setQueryData(
      keys.posts.feed({ scope: { communityId: "c1" }, cursor: null }),
      { posts: [], newLastVisible: null },
    );
    client.setQueryData(keys.posts.votes("c1"), []);

    const { result } = renderHook(() => usePostVoteMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({
        post: { id: "p1", communityId: "c1", title: "t", voteStatus: 0 } as any,
        vote: 1,
        communityId: "c1",
      });
    });

    expect(voteAction).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.votes("c1") });
    expect(
      spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
    ).toBe(true);
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/posts/use-post-vote.test.tsx
```

Expected: FAIL — `Cannot find module '@/lib/queries/posts/use-post-vote'`.

- [x] **Step 3: Write the primitive**

Create `lib/queries/posts/use-post-vote.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post, PostVote } from "@/types/post";

export type PostVoteArgs = {
  post: Post;
  vote: number;
  communityId: string;
  existing?: PostVote;
};

export function usePostVoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ post, vote, communityId, existing }: PostVoteArgs) =>
      voteAction(post, vote, communityId, existing),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.post.id!) });
      void qc.invalidateQueries({ queryKey: keys.posts.votes(vars.communityId) });
      void qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
      });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/posts/use-post-vote.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/posts/use-post-vote.ts __tests__/lib/queries/posts/use-post-vote.test.tsx
git commit -m "feat(queries): usePostVoteMutation with detail/feed/votes invalidation"
```

---

## Task 2: Rewrite `usePostVote.tsx` shell

**Files:**
- Modify (rewrite): `hooks/posts/usePostVote.tsx`

The shell keeps its exported surface (`onVote`, `getPostVotes`, `getPost`) and caller-managed state (`posts/setPosts`, `postVotes/setPostVotes`). It delegates the action call + invalidations to the mutation; it still applies the returned `{ voteChange, newVote, voteIdToDelete }` to caller-supplied state. `useQueryClient` + manual `invalidateQueries(detail)` go away.

- [x] **Step 1: Replace the shell file**

Replace `hooks/posts/usePostVote.tsx`:

```tsx
/* eslint-disable react-hooks/exhaustive-deps */
import { uiAtom } from "@/atoms/uiAtom";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { getPostVotesAction } from "@/app/actions/posts";
import { getPostAction, getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";
import { useSetAtom } from "jotai";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";

type UsePostVoteOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  postVotes: PostVote[];
  setPostVotes: (
    updater: PostVote[] | ((prev: PostVote[]) => PostVote[]),
  ) => void;
};

const usePostVote = ({
  posts,
  setPosts,
  postVotes,
  setPostVotes,
}: UsePostVoteOpts) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const { communityStateValue } = useCommunityState();
  const setUi = useSetAtom(uiAtom);
  const voteMutation = usePostVoteMutation();

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

    const isMember = !!communityStateValue.mySnippets.find(
      (snippet) => snippet.communityId === communityId,
    );

    if (!isMember) {
      let community = communityStateValue.currentCommunity;

      if (!community || community.id !== communityId) {
        try {
          community = (await getCommunityDataAction(communityId)) ?? undefined;
        } catch (error) {
          console.log(
            "Error fetching community data for vote permission",
            error,
          );
        }
      }

      if (
        community &&
        (community.privacyType === "restricted" ||
          community.privacyType === "private")
      ) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to vote in this community.",
          status: "error",
        });
        return;
      }
    }

    try {
      const existingVote = postVotes.find((v) => v.postId === post.id);

      const { voteChange, newVote, voteIdToDelete } =
        await voteMutation.mutateAsync({
          post,
          vote,
          communityId,
          existing: existingVote,
        });

      const updatedPost = { ...post, voteStatus: post.voteStatus + voteChange };

      setPosts((prev) =>
        prev.map((item) => (item.id === post.id ? updatedPost : item)),
      );

      setPostVotes((prev) => {
        let updated = [...prev];
        if (voteIdToDelete) {
          updated = updated.filter((v) => v.id !== voteIdToDelete);
        } else if (newVote) {
          if (existingVote) {
            const idx = updated.findIndex((v) => v.id === existingVote.id);
            if (idx >= 0) updated[idx] = newVote;
          } else {
            updated = [...updated, newVote];
          }
        }
        return updated;
      });

      setUi((prev) =>
        prev.selectedPost?.id === post.id
          ? { ...prev, selectedPost: updatedPost }
          : prev,
      );
    } catch (error) {
      console.log("Error: onVote", error);
      showToast({
        title: "Could not Vote",
        description: "There was an error voting on the post",
        status: "error",
      });
    }
  };

  const getPostVotes = async (postIds: string[]) => {
    if (!user || !postIds.length) return;
    try {
      const fetched = await getPostVotesAction(postIds);
      setPostVotes(fetched as PostVote[]);
    } catch (error) {
      console.log("Error: getPostVotes", error);
      showToast({
        title: "Could not Get Post Votes",
        description: "There was an error while getting your post votes",
        status: "error",
      });
    }
  };

  const getPost = async (postId: string) => {
    try {
      const post = await getPostAction(postId);
      if (post) {
        setUi((prev) => ({ ...prev, selectedPost: post }));
        return post;
      }
      return null;
    } catch (error) {
      console.log("Error: getPost", error);
      return null;
    }
  };

  void posts;

  return { onVote, getPostVotes, getPost };
};

export default usePostVote;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in, open a community feed, upvote and downvote a post. Expect: vote count + colour update without page refresh; toggling existing vote works; no console errors. Open React Query Devtools (dev only) and confirm that on vote, `posts.detail(<id>)`, `posts.votes(<communityId>)`, and the `posts.feed.*` entries flip to "fetching/stale".

- [x] **Step 4: Commit**

```bash
git add hooks/posts/usePostVote.tsx
git commit -m "refactor(posts): route usePostVote through usePostVoteMutation"
```

---

## Task 3: `useCreatePostMutation` primitive

**Files:**
- Create: `lib/queries/posts/use-create-post.ts`
- Create: `__tests__/lib/queries/posts/use-create-post.test.tsx`

Wraps `createPostAction`. Invalidates `posts.feed.*` (predicate) on success. The shell still handles `uploadImage` (post image → R2) before the mutation runs, plus router-back and permission checking.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/posts/use-create-post.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
  createPostAction: vi.fn(async () => undefined),
}));

import { createPostAction } from "@/app/actions/posts";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreatePostMutation", () => {
  it("calls createPostAction and invalidates the posts.feed.* keys", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCreatePostMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({
        communityId: "c1",
        communityImageUrl: undefined,
        postData: { title: "t", body: "b" },
      });
    });

    expect(createPostAction).toHaveBeenCalledWith(
      "c1",
      undefined,
      { title: "t", body: "b" },
      undefined,
    );
    await waitFor(() =>
      expect(
        spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
      ).toBe(true),
    );
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/posts/use-create-post.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/posts/use-create-post.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostAction } from "@/app/actions/posts";

export type CreatePostArgs = {
  communityId: string;
  communityImageUrl: string | undefined;
  postData: { title: string; body: string };
  imageUrl?: string;
};

export function useCreatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, communityImageUrl, postData, imageUrl }: CreatePostArgs) =>
      createPostAction(communityId, communityImageUrl, postData, imageUrl),
    onSuccess: () => {
      void qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
      });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/posts/use-create-post.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/posts/use-create-post.ts __tests__/lib/queries/posts/use-create-post.test.tsx
git commit -m "feat(queries): useCreatePostMutation with feed predicate invalidation"
```

---

## Task 4: Rewrite `useCreatePost.ts` shell

**Files:**
- Modify (rewrite): `hooks/posts/useCreatePost.ts`

Preserves `{ handleCreatePost, loading, error }` surface and the image-upload + permission-check + router-back flow.

- [x] **Step 1: Replace the shell file**

Replace `hooks/posts/useCreatePost.ts`:

```ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "@/hooks/useCustomToast";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { uploadImage } from "@/lib/upload/uploadImage";

const useCreatePost = () => {
  const router = useRouter();
  const showToast = useCustomToast();
  const { data: session } = useSession();
  const [error, setError] = useState(false);
  const { communityStateValue } = useCommunityState();
  const createMutation = useCreatePostMutation();
  const loading = createMutation.isPending;

  const handleCreatePost = async (
    communityId: string,
    communityImageURL: string | undefined,
    postData: { title: string; body: string },
    selectedBlob?: Blob,
  ) => {
    if (!session?.user) {
      window.location.assign("/api/auth/start");
      return;
    }

    const currentCommunity = communityStateValue.currentCommunity;
    if (currentCommunity?.id === communityId) {
      const hasPermission = checkCommunityPermission(
        currentCommunity,
        communityStateValue.mySnippets,
      );
      if (!hasPermission) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to post in this community.",
          status: "error",
        });
        return;
      }
    }

    try {
      let imageUrl: string | undefined;
      if (selectedBlob) {
        const result = await uploadImage("post-image", selectedBlob);
        imageUrl = result.imageUrl;
      }
      await createMutation.mutateAsync({
        communityId,
        communityImageUrl: communityImageURL,
        postData,
        imageUrl,
      });
      router.back();
      showToast({
        title: "Post Created",
        description: "Your post has been created successfully",
        status: "success",
      });
    } catch (err) {
      console.log("handleCreatePost error", err);
      setError(true);
      showToast({
        title: "Error Creating Post",
        description:
          err instanceof Error ? err.message : "There was an error creating your post",
        status: "error",
      });
    }
  };

  return { handleCreatePost, loading, error };
};

export default useCreatePost;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in, open `/community/[id]/submit`, type a title + body, submit. Expect: post creates, router goes back to feed, the new post appears at the top after the feed remounts (per known-limitation #1, this works because `router.back()` re-enters the previous page).

- [x] **Step 4: Commit**

```bash
git add hooks/posts/useCreatePost.ts
git commit -m "refactor(posts): route useCreatePost through useCreatePostMutation"
```

---

## Task 5: `useDeletePostMutation` primitive

**Files:**
- Create: `lib/queries/posts/use-delete-post.ts`
- Create: `__tests__/lib/queries/posts/use-delete-post.test.tsx`

Wraps `deletePostAction`. Invalidates `posts.feed.*` (predicate) and `posts.detail(postId)` on success.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/posts/use-delete-post.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
  deletePostAction: vi.fn(async () => undefined),
}));

import { deletePostAction } from "@/app/actions/posts";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeletePostMutation", () => {
  it("calls deletePostAction and invalidates detail + feed predicate", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeletePostMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ postId: "p1" });
    });

    expect(deletePostAction).toHaveBeenCalledWith("p1");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") }),
    );
    expect(
      spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
    ).toBe(true);
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/posts/use-delete-post.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/posts/use-delete-post.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePostAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";

export type DeletePostArgs = { postId: string };

export function useDeletePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId }: DeletePostArgs) => deletePostAction(postId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
      void qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
      });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/posts/use-delete-post.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/posts/use-delete-post.ts __tests__/lib/queries/posts/use-delete-post.test.tsx
git commit -m "feat(queries): useDeletePostMutation with detail + feed predicate invalidation"
```

---

## Task 6: Rewrite `usePostDeletion.ts` shell

**Files:**
- Modify (rewrite): `hooks/posts/usePostDeletion.ts`

Preserves `{ onDeletePost }` surface. The old shell did:
- optimistic local list removal (caller-supplied `setPosts(filter)`)
- optimistic `setQueryData` for `posts.saved(userId)`
- await action
- on success: invalidate `posts.detail`
- on error: restore local list snapshot

After C3 we drop the optimistic `setQueryData` on `posts.saved` (per known-limitation #2). The caller-supplied local list removal stays — that's just UI plumbing for the caller's own state. Rollback on error stays. Detail + feed invalidation moves to the mutation.

- [x] **Step 1: Replace the shell file**

Replace `hooks/posts/usePostDeletion.ts`:

```ts
import { Post } from "@/types/post";
import React from "react";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";

type UsePostDeletionOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
};

const usePostDeletion = ({ posts, setPosts }: UsePostDeletionOpts) => {
  const deleteMutation = useDeletePostMutation();

  const onDeletePost = async (post: Post): Promise<boolean> => {
    const snapshot = posts;
    setPosts((prev) => prev.filter((item) => item.id !== post.id));

    try {
      await deleteMutation.mutateAsync({ postId: post.id! });
      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      setPosts(snapshot);
      return false;
    }
  };

  return { onDeletePost };
};

export default usePostDeletion;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in, delete a post you own from the feed (community admin or post owner). Expect: post disappears from feed; navigating to its detail URL shows 404 or empty. If the post was also in your saved list, it disappears from saved list on next visit (one network round trip's delay because the optimistic `setQueryData` is gone).

- [x] **Step 4: Commit**

```bash
git add hooks/posts/usePostDeletion.ts
git commit -m "refactor(posts): route usePostDeletion through useDeletePostMutation"
```

---

## Task 7: `useSavePostMutation` + `useUnsavePostMutation` primitives

**Files:**
- Create: `lib/queries/posts/use-saved-posts-mutation.ts`
- Create: `__tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx`

Two mutations sharing one file. Both invalidate `posts.saved(userId)` on success. `useSavePostMutation` returns the new `SavedPost` from `savePostAction`; `useUnsavePostMutation` returns void.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/posts", () => ({
  savePostAction: vi.fn(async (post: any) => ({
    id: post.id,
    postId: post.id,
    communityId: post.communityId,
    postTitle: post.title,
    communityImageUrl: post.communityImageUrl,
  })),
  unsavePostAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import {
  savePostAction,
  unsavePostAction,
} from "@/app/actions/posts";
import {
  useSavePostMutation,
  useUnsavePostMutation,
} from "@/lib/queries/posts/use-saved-posts-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useSavePostMutation", () => {
  it("calls savePostAction and invalidates posts.saved(userId) on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useSavePostMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({
        id: "p1",
        communityId: "c1",
        title: "t",
        communityImageUrl: undefined,
      } as any);
    });

    expect(savePostAction).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.saved("u1") }),
    );
  });
});

describe("useUnsavePostMutation", () => {
  it("calls unsavePostAction and invalidates posts.saved(userId) on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUnsavePostMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ postId: "p1" });
    });

    expect(unsavePostAction).toHaveBeenCalledWith("p1");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.saved("u1") }),
    );
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitives**

Create `lib/queries/posts/use-saved-posts-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePostAction, unsavePostAction } from "@/app/actions/posts";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Post } from "@/types/post";

export function useSavePostMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: (post: Post) => savePostAction(post),
    onSuccess: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.posts.saved(userId) });
      }
    },
  });
}

export type UnsavePostArgs = { postId: string };

export function useUnsavePostMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ postId }: UnsavePostArgs) => unsavePostAction(postId),
    onSuccess: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.posts.saved(userId) });
      }
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/posts/use-saved-posts-mutation.ts __tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx
git commit -m "feat(queries): useSavePostMutation + useUnsavePostMutation"
```

---

## Task 8: Rewrite save/unsave half of `useSavedPosts.tsx` shell

**Files:**
- Modify (partial): `hooks/posts/useSavedPosts.tsx`

The read half landed in C2 (`useSavedPostsQuery`). After this task the shell exposes the same surface (`savedPosts`, `onSavePost`, `onRemoveSavedPost`, `isPostSaved`, `fetchSavedPosts`, `loading`), but `onSavePost` / `onRemoveSavedPost` route through the two mutations from Task 7. The optimistic `setQueryData` calls and the post-action `invalidateQueries` calls in the shell go away; invalidation belongs to the mutation now.

- [x] **Step 1: Replace the shell file**

Replace `hooks/posts/useSavedPosts.tsx`:

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import useCustomToast from "../useCustomToast";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";
import {
  useSavePostMutation,
  useUnsavePostMutation,
} from "@/lib/queries/posts/use-saved-posts-mutation";

const useSavedPosts = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const savedQuery = useSavedPostsQuery();
  const savedPosts: SavedPost[] = (savedQuery.data ?? []) as SavedPost[];
  const showToast = useCustomToast();
  const saveMutation = useSavePostMutation();
  const unsaveMutation = useUnsavePostMutation();

  const fetchSavedPosts = async () => {
    await savedQuery.refetch();
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    const isSaved = savedPosts.find((item) => item.postId === post.id);
    try {
      if (isSaved) {
        await unsaveMutation.mutateAsync({ postId: post.id! });
        showToast({ title: "Post removed from saved", status: "success" });
      } else {
        await saveMutation.mutateAsync(post);
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
      await unsaveMutation.mutateAsync({ postId });
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
    !!savedPosts.find((item) => item.postId === postId);

  return {
    savedPosts,
    onSavePost,
    onRemoveSavedPost,
    isPostSaved,
    fetchSavedPosts,
    loading: savedQuery.isLoading,
  };
};

export default useSavedPosts;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in. From a community feed, click "save" on a post — toast appears; visit `/posts/saved` (or wherever the saved list lives) and the post appears. Click "unsave" — toast appears; the post disappears from the saved list. Expect one network round trip's delay before the UI reflects each change (per known-limitation #2).

- [x] **Step 4: Commit**

```bash
git add hooks/posts/useSavedPosts.tsx
git commit -m "refactor(posts): route useSavedPosts mutations through useSave/UnsavePostMutation"
```

---

## Task 9: Final green-gate verification

**Files:** none modified.

Run the full posts-PR green gate. Fix any breakage before merging the branch.

- [x] **Step 1: Run tests**

```bash
pnpm test
```

Expected: all green, including the four new mutation tests under `__tests__/lib/queries/posts/`.

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Lint**

```bash
pnpm eslint
```

Expected: clean. Confirm that no new `// eslint-disable-next-line react-hooks/set-state-in-effect` suppressions were added; the previous suppressions in the four touched shells (if any) are unchanged or removed.

- [x] **Step 4: Build**

```bash
pnpm build
```

Expected: clean.

- [ ] **Step 5: Smoke checklist (browser, signed in)**

Run through each manually:
- [x] Upvote and downvote a post in a community feed — vote count and colour update without page refresh
- [ ] Submit a new post from `/community/[id]/submit` — `router.back()` lands on the feed and the new post appears at the top after remount
- [ ] Delete a post (as owner or admin) — disappears from feed; detail URL returns 404
- [ ] Save a post — toast appears; saved list shows it on next visit
- [ ] Unsave a post — toast appears; saved list updates on next visit
- [ ] React Query Devtools shows the expected keys flipping to "fetching/stale" on each action

- [ ] **Step 6: Commit any test/lint fixes**

If steps 1–4 surfaced issues that required code tweaks, commit them with a descriptive message. If no fixes were needed, skip this step.

```bash
git status
```

Expected: clean tree.

---

## Out of scope (recorded for follow-up)

- Mutations in groups 2–5 (comments, admin, community, profile) — each gets its own brainstorm + plan.
- Optimistic UI for save / vote — post-Phase-C polish.
- `useInfiniteQuery` refactor of `usePostsFeed` — would make `posts.feed.*` invalidation auto-refresh the in-place view.
- `posts.votes` key shape decision (currently `communityId`, parent spec says `userId`).
