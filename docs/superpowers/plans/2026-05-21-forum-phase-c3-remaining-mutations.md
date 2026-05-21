# Phase C3 (Remaining Groups) — Mutations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 12 remaining mutation hooks (comments × 2, admin × 2, community × 7, profile × 1) to `useMutation` primitives under `lib/queries/<group>/use-*-mutation.ts`, completing the C3 invalidation contract from the parent spec ([§6](../specs/2026-05-20-forum-phase-c-tanstack-query-design.md#6-mutation--invalidation-map-contract-enforced-in-c3)). After this PR, every server-state mutation in the forum flows through TanStack Query's mutation pipeline and corresponding queries refresh purely via invalidation — no `setQueryData` or manual `refetch`/`loadXxx` calls remain in component code.

**Architecture:** Each mutation gets a primitive at `lib/queries/<group>/use-<name>-mutation.ts` owning the `useMutation` config (mutationFn + invalidations on onSuccess). Existing legacy shells under `hooks/<group>/` are rewritten to delegate to those primitives while preserving routing/toast/auth-gating side effects. Two read shells with `fetchQuery + useState` (`useAdminList`, `useCommunityMembers`) are converted to subscriptive `useQuery` so invalidation actually refreshes their mounted views. Optimistic local-state mirrors and `setQueryData` writes are removed (per parent spec §12).

**Tech Stack:** TanStack Query v5 (`useMutation`, `useQuery`, `invalidateQueries`), Next 16 App Router, Vitest + happy-dom + Testing Library, pnpm. Tests reuse `__tests__/helpers/renderWithProviders.tsx`.

**Spec reference:** [docs/superpowers/specs/2026-05-20-forum-phase-c3-mutations-design.md](../specs/2026-05-20-forum-phase-c3-mutations-design.md) (modified C3 design — §4 PR slicing carved this work into 5 PRs; only PR 1 / posts shipped); parent spec [2026-05-20-forum-phase-c-tanstack-query-design.md](../specs/2026-05-20-forum-phase-c-tanstack-query-design.md) §6 (invalidation map), §10 (testing strategy), §12 (optimistic deferred), §8 (C3 green gate). C3 posts reference plan: [2026-05-20-forum-phase-c3-posts-mutations.md](./2026-05-20-forum-phase-c3-posts-mutations.md).

---

## Known limitations going in

These constrain what this PR can and cannot promise. They are intentional and inherited from upstream decisions; the smoke checklist sets correct expectations.

1. **No optimistic UI.** Per parent spec §12, every mutation: `action call → await success → invalidate`. UI shows one network round trip's worth of staleness on each toggle. If save/join/vote feel laggy in practice, optimistic UI ships as a separate backlog item (see [backlog.md](../backlog.md) — `Optimistic UI for join / save mutations`).

2. **Currently-mounted feed views don't auto-refresh on community mutations.** `useCommunitiesFeed` and `usePostsFeed` still use `fetchQuery + useState` accumulators (`useInfiniteQuery` refactor is in the backlog). Invalidating `community.list.*` marks the cached page entries stale, so the *next* mount re-fetches; the currently-mounted view doesn't. UX impact: after `createCommunity` the `router.push(...)` navigation triggers a fresh mount and the new community is visible. Standalone in-place refresh is post-Phase-C work.

3. **No new server actions, no schema changes, no auth changes.** Existing actions in `app/actions/{comments,admin,community,profile}.ts` are the `mutationFn` targets verbatim.

4. **`posts.votes` key shape drift (carried from posts PR).** Parent spec §6 keys it by `userId`; actual code keys by `communityId` (see `lib/queries/keys.ts:14`). Not relevant to this PR's groups, but the key factory remains as-is.

5. **Profile group has no read query yet.** `useUserProfile.uploadImage`/`removeImage`/`updateName` invalidate `keys.profile(userId)` per parent spec §6, but no `useProfileQuery` consumer exists — `ProfileModal` reads user data from `useSession()` and relies on `router.refresh()` to repaint server components. The mutation primitive's `invalidateQueries(keys.profile(userId))` is forward-compatible plumbing; functional refresh keeps depending on `router.refresh()`.

---

## File Structure

**New primitives (12 mutation hooks + 2 helper hooks):**
- `lib/queries/comments/use-create-comment-mutation.ts` — `useCreateCommentMutation`
- `lib/queries/comments/use-delete-comment-mutation.ts` — `useDeleteCommentMutation`
- `lib/queries/admin/use-add-admin-mutation.ts` — `useAddAdminMutation`
- `lib/queries/admin/use-remove-admin-mutation.ts` — `useRemoveAdminMutation`
- `lib/queries/admin/use-admin-list.ts` — `useCommunityAdminsListQuery` (NEW subscriptive read; replaces `hooks/admin/useAdminList.ts` fetchQuery shell)
- `lib/queries/community/use-create-community-mutation.ts` — `useCreateCommunityMutation`
- `lib/queries/community/use-delete-community-mutation.ts` — `useDeleteCommunityMutation`
- `lib/queries/community/use-join-community-mutation.ts` — `useJoinCommunityMutation`
- `lib/queries/community/use-leave-community-mutation.ts` — `useLeaveCommunityMutation`
- `lib/queries/community/use-community-privacy-mutation.ts` — `useCommunityPrivacyMutation`
- `lib/queries/community/use-remove-community-member-mutation.ts` — `useRemoveCommunityMemberMutation`
- `lib/queries/community/use-community-image-mutation.ts` — `useUploadCommunityImageMutation` + `useDeleteCommunityImageMutation`
- `lib/queries/community/use-community-members-list.ts` — `useCommunityMembersListQuery` (NEW subscriptive read; replaces `hooks/community/useCommunityMembers.ts` fetchQuery shell)
- `lib/queries/profile/use-profile-mutations.ts` — `useUploadProfileImageMutation` + `useRemoveProfileImageMutation` + `useUpdateProfileNameMutation`

**Rewritten shells (public surface preserved or minimally trimmed; call-site changes noted in tasks):**
- `hooks/comments/useCreateComment.ts` — drops `setComments` param
- `hooks/comments/useDeleteComment.ts` — drops `setComments` param, drops descendant computation (server cascades, invalidation refreshes)
- `hooks/comments/useCommentList.ts` — drops `setComments` mirror + lint suppression; returns `query.data` directly
- `hooks/admin/useAddAdmin.ts` — drops `updateAdmins` setter param
- `hooks/admin/useRemoveAdmin.ts` — drops `updateAdmins` setter param
- `hooks/admin/useAdminList.ts` — deleted (replaced by direct `useCommunityAdminsListQuery` usage at the one call site)
- `hooks/community/useCreateCommunity.ts`
- `hooks/community/useDeleteCommunity.ts`
- `hooks/community/useJoinCommunity.tsx`
- `hooks/community/useLeaveCommunity.tsx`
- `hooks/community/useCommunityPrivacy.ts`
- `hooks/community/useRemoveCommunityMember.ts`
- `hooks/community/useCommunityImage.ts`
- `hooks/community/useCommunityMembers.ts` — deleted (replaced by direct `useCommunityMembersListQuery` usage in `CommunityMembersModal.tsx`)
- `hooks/useUserProfile.ts`

**Updated call sites (forced by shell surface trims):**
- `components/posts/comments/Comments.tsx` — drops `setComments` plumbing
- `components/modal/community-settings/AdminManager.tsx` — uses `useCommunityAdminsListQuery`; drops `setAdmins` plumbing
- `components/modal/community-members/CommunityMembersModal.tsx` — uses `useCommunityMembersListQuery`; drops manual `loadMembers` re-call after remove

**New tests (one per primitive group):**
- `__tests__/lib/queries/comments/use-create-comment-mutation.test.tsx`
- `__tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx`
- `__tests__/lib/queries/admin/use-add-admin-mutation.test.tsx`
- `__tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx`
- `__tests__/lib/queries/community/use-create-community-mutation.test.tsx`
- `__tests__/lib/queries/community/use-delete-community-mutation.test.tsx`
- `__tests__/lib/queries/community/use-join-community-mutation.test.tsx`
- `__tests__/lib/queries/community/use-leave-community-mutation.test.tsx`
- `__tests__/lib/queries/community/use-community-privacy-mutation.test.tsx`
- `__tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx`
- `__tests__/lib/queries/community/use-community-image-mutation.test.tsx`
- `__tests__/lib/queries/profile/use-profile-mutations.test.tsx`

---

## Invalidation contract (from parent spec §6)

| Mutation | Invalidates |
|---|---|
| `useCreateCommentMutation` | `keys.comments.forPost(postId)`, `keys.posts.detail(postId)` |
| `useDeleteCommentMutation` | `keys.comments.forPost(postId)`, `keys.posts.detail(postId)` |
| `useAddAdminMutation` | `keys.community.admins(communityId)` |
| `useRemoveAdminMutation` | `keys.community.admins(communityId)` |
| `useCreateCommunityMutation` | `keys.community.list.*` (predicate), `keys.community.snippets(userId)` |
| `useDeleteCommunityMutation` | `keys.community.list.*` (predicate), `keys.community.detail(id)`, `keys.community.snippets(userId)` |
| `useJoinCommunityMutation` | `keys.community.snippets(userId)`, `keys.community.detail(id)`, `keys.community.members(id)` |
| `useLeaveCommunityMutation` | `keys.community.snippets(userId)`, `keys.community.detail(id)`, `keys.community.members(id)` |
| `useCommunityPrivacyMutation` | `keys.community.detail(id)` |
| `useRemoveCommunityMemberMutation` | `keys.community.members(id)`, `keys.community.snippets(removedUserId)` |
| `useUploadCommunityImageMutation` / `useDeleteCommunityImageMutation` | `keys.community.detail(id)`, `keys.community.snippets(userId)` |
| `useUploadProfileImageMutation` / `useRemoveProfileImageMutation` / `useUpdateProfileNameMutation` | `keys.profile(userId)` |

Predicate pattern (used wherever the table says "predicate"):
```ts
qc.invalidateQueries({
  predicate: (q) => q.queryKey[0] === "community" && q.queryKey[1] === "list",
});
```

---

# Group 1 — Comments

## Task 1: `useCreateCommentMutation` primitive

**Files:**
- Create: `lib/queries/comments/use-create-comment-mutation.ts`
- Create: `__tests__/lib/queries/comments/use-create-comment-mutation.test.tsx`

Wraps `createCommentAction`. On success, invalidates `keys.comments.forPost(postId)` and `keys.posts.detail(postId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/comments/use-create-comment-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/comments", () => ({
  createCommentAction: vi.fn(async () => ({
    id: "c1",
    postId: "p1",
    communityId: "co1",
    text: "hi",
    creatorId: "u1",
    creatorDisplayText: "u",
    parentId: null,
    depth: 0,
    postTitle: "t",
    createdAt: new Date().toISOString(),
    updatedAt: null,
  })),
}));

import { createCommentAction } from "@/app/actions/comments";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useCreateCommentMutation", () => {
  it("calls createCommentAction and invalidates comments + post detail on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCreateCommentMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({
        communityId: "co1",
        postId: "p1",
        postTitle: "t",
        commentText: "hi",
      });
    });

    expect(createCommentAction).toHaveBeenCalledWith("co1", "p1", "t", "hi", undefined);
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.comments.forPost("p1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") });
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/comments/use-create-comment-mutation.test.tsx
```

Expected: FAIL — `Cannot find module '@/lib/queries/comments/use-create-comment-mutation'`.

- [x] **Step 3: Write the primitive**

Create `lib/queries/comments/use-create-comment-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentAction } from "@/app/actions/comments";
import { keys } from "@/lib/queries/keys";

export type CreateCommentArgs = {
  communityId: string;
  postId: string;
  postTitle: string;
  commentText: string;
  parentId?: string;
};

export function useCreateCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, postId, postTitle, commentText, parentId }: CreateCommentArgs) =>
      createCommentAction(communityId, postId, postTitle, commentText, parentId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
      void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/comments/use-create-comment-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/comments/use-create-comment-mutation.ts __tests__/lib/queries/comments/use-create-comment-mutation.test.tsx
git commit -m "feat(queries): useCreateCommentMutation with comments + post-detail invalidation"
```

---

## Task 2: `useDeleteCommentMutation` primitive

**Files:**
- Create: `lib/queries/comments/use-delete-comment-mutation.ts`
- Create: `__tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx`

Wraps `deleteCommentAction`. Server cascades descendant deletion; we no longer compute descendants client-side (that was optimistic UI). On success: invalidate `keys.comments.forPost(postId)` and `keys.posts.detail(postId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/comments", () => ({
  deleteCommentAction: vi.fn(async () => undefined),
}));

import { deleteCommentAction } from "@/app/actions/comments";
import { useDeleteCommentMutation } from "@/lib/queries/comments/use-delete-comment-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeleteCommentMutation", () => {
  it("calls deleteCommentAction and invalidates comments + post-detail on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCommentMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ commentId: "c1", postId: "p1" });
    });

    expect(deleteCommentAction).toHaveBeenCalledWith("c1", "p1");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.comments.forPost("p1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.posts.detail("p1") });
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/comments/use-delete-comment-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "@/app/actions/comments";
import { keys } from "@/lib/queries/keys";

export type DeleteCommentArgs = { commentId: string; postId: string };

export function useDeleteCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, postId }: DeleteCommentArgs) =>
      deleteCommentAction(commentId, postId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
      void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/comments/use-delete-comment-mutation.ts __tests__/lib/queries/comments/use-delete-comment-mutation.test.tsx
git commit -m "feat(queries): useDeleteCommentMutation with comments + post-detail invalidation"
```

---

## Task 3: Rewrite `useCommentList.ts` and the two comment shells; update `Comments.tsx`

**Files:**
- Modify (rewrite): `hooks/comments/useCommentList.ts`
- Modify (rewrite): `hooks/comments/useCreateComment.ts`
- Modify (rewrite): `hooks/comments/useDeleteComment.ts`
- Modify: `components/posts/comments/Comments.tsx`

Single task because the three files form one tightly coupled surface — drop `setComments` from `useCommentList` and the consumer drops the plumbing in one move. Validation: typecheck + smoke.

- [x] **Step 1: Replace `hooks/comments/useCommentList.ts`**

Replace with:

```ts
"use client";

import { useCallback, useEffect } from "react";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

/**
 * Subscribes to the comments for a post via TanStack Query.
 * After C3 mutations land, the `setComments` mirror is gone — consumers
 * read `comments` straight from the query result. The error toast lives
 * in a useEffect so it fires once per error, not on every render.
 */
const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const postId = selectedPost?.id ?? "";

  const query = useCommentsForPostQuery({
    postId,
    enabled: !!selectedPost,
  });

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching comments", query.error);
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    }
  }, [query.error, showToast]);

  const comments: Comment[] = query.data ?? [];

  const loadComments = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    comments,
    commentFetchLoading: query.isLoading,
    loadComments,
  };
};

export default useCommentList;
```

This useEffect calls `showToast` only — no setState — so `react-hooks/set-state-in-effect` does not flag it, and no suppression is needed.

The previous file had `// eslint-disable-next-line react-hooks/set-state-in-effect -- mirror query data into local list to support optimistic insert via setComments`. The mirror is gone, so the suppression is gone.

- [x] **Step 2: Replace `hooks/comments/useCreateComment.ts`**

Replace with:

```ts
import { useState } from "react";
import { uiAtom } from "@/atoms/uiAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";

/**
 * Shell over useCreateCommentMutation. Preserves the public `createComment` /
 * `createLoading` surface. Permission gating, toasts, and bumping the
 * selectedPost comment count in uiAtom stay here. The numberOfComments bump
 * is a best-effort UI mirror for the post header; the canonical count
 * refreshes via posts.detail invalidation.
 */
const useCreateComment = (selectedPost: Post | null) => {
  const setUi = useSetAtom(uiAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);
  const { communityStateValue } = useCommunityState();
  const mutation = useCreateCommentMutation();

  const onCreateComment = async (commentText: string, parentId?: string) => {
    if (!selectedPost) return;
    setCreateLoading(true);

    const currentCommunity = communityStateValue.currentCommunity;
    if (currentCommunity?.id === selectedPost.communityId) {
      const hasPermission = checkCommunityPermission(
        currentCommunity,
        communityStateValue.mySnippets,
      );
      if (!hasPermission) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to comment in this community.",
          status: "error",
        });
        setCreateLoading(false);
        return;
      }
    }

    try {
      await mutation.mutateAsync({
        communityId: selectedPost.communityId,
        postId: selectedPost.id!,
        postTitle: selectedPost.title,
        commentText,
        parentId,
      });
      setUi((prev) =>
        prev.selectedPost
          ? {
              ...prev,
              selectedPost: {
                ...prev.selectedPost,
                numberOfComments: prev.selectedPost.numberOfComments + 1,
              },
            }
          : prev,
      );
    } catch (error: any) {
      console.log("onCreateComment error", error);
      showToast({
        title: "Comment failed",
        description: error.message || "There was an error creating your comment",
        status: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return { createComment: onCreateComment, createLoading };
};

export default useCreateComment;
```

- [x] **Step 3: Replace `hooks/comments/useDeleteComment.ts`**

Replace with:

```ts
import { uiAtom } from "@/atoms/uiAtom";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useDeleteCommentMutation } from "@/lib/queries/comments/use-delete-comment-mutation";

/**
 * Shell over useDeleteCommentMutation. Preserves the public `deleteComment` /
 * `deleteLoadingId` surface. The server cascades descendant deletes; the
 * post-detail count refreshes via posts.detail invalidation. The uiAtom
 * mirror decrements by 1 (best-effort header update) and is corrected by the
 * invalidated query.
 */
const useDeleteComment = () => {
  const setUi = useSetAtom(uiAtom);
  const showToast = useCustomToast();
  const [deleteLoadingId, setDeleteLoadingId] = useState("");
  const mutation = useDeleteCommentMutation();

  const onDeleteComment = async (comment: Comment) => {
    setDeleteLoadingId(comment.id);
    try {
      await mutation.mutateAsync({ commentId: comment.id, postId: comment.postId });
      setUi((prev) =>
        prev.selectedPost
          ? {
              ...prev,
              selectedPost: {
                ...prev.selectedPost,
                numberOfComments: Math.max(0, prev.selectedPost.numberOfComments - 1),
              },
            }
          : prev,
      );
    } catch (error: any) {
      console.log("onDeleteComment error", error);
      showToast({
        title: "Delete failed",
        description: "There was an error deleting your comment",
        status: "error",
      });
    } finally {
      setDeleteLoadingId("");
    }
  };

  return { deleteComment: onDeleteComment, deleteLoadingId };
};

export default useDeleteComment;
```

Note: surface change — the hook now takes no arguments (was `(comments, setComments)`). Caller updates in next step.

- [x] **Step 4: Update `components/posts/comments/Comments.tsx`**

Replace lines 46-55 (the three hook destructures) with:

```tsx
  const { comments, commentFetchLoading } = useCommentList(selectedPost);
  const { createComment, createLoading } = useCreateComment(selectedPost);
  const { deleteComment, deleteLoadingId } = useDeleteComment();
```

Everything else in `Comments.tsx` stays — `comments` is still consumed for the tree collection, `deleteLoadingId` still drives per-row spinners.

- [x] **Step 5: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 6: Run comments-related tests**

```bash
pnpm test __tests__/lib/queries/comments
```

Expected: PASS (the two new mutation tests from Tasks 1–2).

- [x] **Step 7: Smoke in browser**

Sign in, open a post detail page in a community where you can comment. Type a comment, submit. Expected: comment appears in the list within one round trip; numberOfComments in the post header increments. Reply to a comment — same. Delete a comment with replies — the comment and its descendants disappear (server cascades); the count decrements. Open React Query Devtools and confirm `comments.<postId>` and `posts.detail.<postId>` flip to fetching/stale on each action.

- [ ] **Step 8: Commit**

```bash
git add hooks/comments/useCommentList.ts hooks/comments/useCreateComment.ts hooks/comments/useDeleteComment.ts components/posts/comments/Comments.tsx
git commit -m "refactor(comments): route create/delete through TanStack mutations; drop setComments mirror"
```

---

# Group 2 — Admin

## Task 4: New `useCommunityAdminsListQuery` (subscriptive read)

**Files:**
- Create: `lib/queries/admin/use-admin-list.ts`

This replaces `hooks/admin/useAdminList.ts`'s `fetchQuery + useState` pattern with a subscriptive `useQuery`. Required so that `useAddAdminMutation`/`useRemoveAdminMutation` invalidation actually refreshes the mounted `AdminManager` view (parent spec §8 green gate: "no manual refetch calls in component code").

- [x] **Step 1: Write the query primitive**

Create `lib/queries/admin/use-admin-list.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { AdminUser } from "@/types/adminUser";

export function useCommunityAdminsListQuery({
  communityId,
  enabled = true,
}: {
  communityId: string;
  enabled?: boolean;
}) {
  return useQuery<AdminUser[]>({
    queryKey: keys.community.admins(communityId),
    queryFn: async () => {
      const r = await fetchCommunityAdminsAction(communityId);
      return r.map((m) => ({
        uid: m.id,
        email: m.email,
        displayName: m.displayName ?? undefined,
      }));
    },
    enabled: enabled && !!communityId,
    staleTime: 0, // matches the per-key override in parent spec §5 (admin = security-relevant, always re-validate)
  });
}
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Commit**

```bash
git add lib/queries/admin/use-admin-list.ts
git commit -m "feat(queries): useCommunityAdminsListQuery (subscriptive read)"
```

---

## Task 5: `useAddAdminMutation` primitive

**Files:**
- Create: `lib/queries/admin/use-add-admin-mutation.ts`
- Create: `__tests__/lib/queries/admin/use-add-admin-mutation.test.tsx`

Wraps `addAdminAction`. On success: invalidate `keys.community.admins(communityId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/admin/use-add-admin-mutation.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/admin/use-add-admin-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/admin/use-add-admin-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminAction } from "@/app/actions/admin";
import { keys } from "@/lib/queries/keys";

export type AddAdminArgs = { communityId: string; targetUserId: string };

export function useAddAdminMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, targetUserId }: AddAdminArgs) =>
      addAdminAction(communityId, targetUserId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.admins(vars.communityId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/admin/use-add-admin-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/admin/use-add-admin-mutation.ts __tests__/lib/queries/admin/use-add-admin-mutation.test.tsx
git commit -m "feat(queries): useAddAdminMutation with community.admins invalidation"
```

---

## Task 6: `useRemoveAdminMutation` primitive

**Files:**
- Create: `lib/queries/admin/use-remove-admin-mutation.ts`
- Create: `__tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx`

Wraps `removeAdminAction`. Invalidates `keys.community.admins(communityId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/admin/use-remove-admin-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeAdminAction } from "@/app/actions/admin";
import { keys } from "@/lib/queries/keys";

export type RemoveAdminArgs = { communityId: string; targetUserId: string };

export function useRemoveAdminMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, targetUserId }: RemoveAdminArgs) =>
      removeAdminAction(communityId, targetUserId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.admins(vars.communityId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/admin/use-remove-admin-mutation.ts __tests__/lib/queries/admin/use-remove-admin-mutation.test.tsx
git commit -m "feat(queries): useRemoveAdminMutation with community.admins invalidation"
```

---

## Task 7: Rewrite admin shells + `AdminManager.tsx`; delete `useAdminList.ts`

**Files:**
- Modify (rewrite): `hooks/admin/useAddAdmin.ts`
- Modify (rewrite): `hooks/admin/useRemoveAdmin.ts`
- Delete: `hooks/admin/useAdminList.ts`
- Modify: `components/modal/community-settings/AdminManager.tsx`

The shells trim their `updateAdmins` setter argument; `AdminManager.tsx` switches from `useAdminList` to direct `useCommunityAdminsListQuery` usage.

- [x] **Step 1: Replace `hooks/admin/useAddAdmin.ts`**

Replace with:

```ts
import { useCallback } from "react";
import { useAddAdminMutation } from "@/lib/queries/admin/use-add-admin-mutation";

/**
 * Shell over useAddAdminMutation. Preserves the `handleAddAdmin(communityId,
 * targetUserId)` surface. Invalidation of community.admins refreshes the
 * AdminManager view via useCommunityAdminsListQuery.
 */
const useAddAdmin = () => {
  const mutation = useAddAdminMutation();

  const handleAddAdmin = useCallback(
    async (communityId: string, targetUserId: string) => {
      await mutation.mutateAsync({ communityId, targetUserId });
    },
    [mutation],
  );

  return { handleAddAdmin };
};

export default useAddAdmin;
```

- [x] **Step 2: Replace `hooks/admin/useRemoveAdmin.ts`**

Replace with:

```ts
import { useCallback } from "react";
import { useRemoveAdminMutation } from "@/lib/queries/admin/use-remove-admin-mutation";

/**
 * Shell over useRemoveAdminMutation. Preserves the `handleRemoveAdmin(
 * communityId, targetUserId)` surface.
 */
const useRemoveAdmin = () => {
  const mutation = useRemoveAdminMutation();

  const handleRemoveAdmin = useCallback(
    async (communityId: string, targetUserId: string) => {
      await mutation.mutateAsync({ communityId, targetUserId });
    },
    [mutation],
  );

  return { handleRemoveAdmin };
};

export default useRemoveAdmin;
```

- [x] **Step 3: Delete `hooks/admin/useAdminList.ts`**

```bash
rm hooks/admin/useAdminList.ts
```

- [x] **Step 4: Update `components/modal/community-settings/AdminManager.tsx`**

Three changes:

1. Replace the `useAdminList` import with the new query primitive:

```diff
-import useAdminList from "@/hooks/admin/useAdminList";
+import { useCommunityAdminsListQuery } from "@/lib/queries/admin/use-admin-list";
```

2. Replace the destructure (was line 34) + the `useEffect` block (was lines 60-68) with the query hook:

```diff
-  const { admins, setAdmins, loading, loadAdmins } = useAdminList();
+  const adminsQuery = useCommunityAdminsListQuery({ communityId: communityData.id });
+  const admins = adminsQuery.data ?? [];
+  const loading = adminsQuery.isLoading;
```

Delete the entire `useEffect(() => { loadAdmins(communityData.id).catch(...) }, [...])` block — the query auto-fetches.

3. Update the two call sites (lines 98 and 129) to drop the trailing setter argument:

```diff
-      await handleAddAdmin(
-        communityData.id,
-        newUser,
-        communityData.imageUrl,
-        setAdmins
-      );
+      await handleAddAdmin(communityData.id, newUser.uid);
```

```diff
-      await handleRemoveAdmin(communityData.id, adminToRemove, setAdmins);
+      await handleRemoveAdmin(communityData.id, adminToRemove);
```

If the file imports `Spinner` or other Chakra primitives that become unused after the trim, leave them — they're harmless. If error-handling toast wording referenced the setter ("Could not fetch admins"), keep the toast and tie it to `adminsQuery.error` if you like — or drop the dedicated toast (the query is silent on error in this primitive; consumers can render a fallback). Recommended: drop the dedicated error toast; the empty list is sufficient signal.

- [x] **Step 5: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 6: Run admin tests**

```bash
pnpm test __tests__/lib/queries/admin
```

Expected: PASS (the two mutation tests).

- [x] **Step 7: Smoke in browser**

Sign in as a community admin. Open Community Settings → Admin Manager. Expect: admin list loads. Add a new admin by email — they appear in the list within one round trip (no page refresh). Remove an admin — they disappear. Confirm React Query Devtools shows `community.admins.<id>` invalidating after each mutation.

- [x] **Step 8: Commit**

```bash
git add hooks/admin/useAddAdmin.ts hooks/admin/useRemoveAdmin.ts components/modal/community-settings/AdminManager.tsx
git rm hooks/admin/useAdminList.ts
git commit -m "refactor(admin): route add/remove admin through TanStack mutations; AdminManager subscribes via useCommunityAdminsListQuery"
```

---

# Group 3 — Community

## Task 8: `useCreateCommunityMutation` primitive

**Files:**
- Create: `lib/queries/community/use-create-community-mutation.ts`
- Create: `__tests__/lib/queries/community/use-create-community-mutation.test.tsx`

Wraps `createCommunityAction`. Invalidates `keys.community.list.*` (predicate) and `keys.community.snippets(userId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-create-community-mutation.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-create-community-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-create-community-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type CreateCommunityArgs = { communityName: string; communityType: string };

export function useCreateCommunityMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityName, communityType }: CreateCommunityArgs) =>
      createCommunityAction(communityName, communityType),
    onSuccess: () => {
      void qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === "community" && q.queryKey[1] === "list",
      });
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-create-community-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-create-community-mutation.ts __tests__/lib/queries/community/use-create-community-mutation.test.tsx
git commit -m "feat(queries): useCreateCommunityMutation with list + snippets invalidation"
```

---

## Task 9: Rewrite `useCreateCommunity.ts` shell

**Files:**
- Modify (rewrite): `hooks/community/useCreateCommunity.ts`

Preserves `{ createCommunity, loading, error, setError }` surface. Auth gate, validation regex, router.push, and error toast stay in the shell.

- [x] **Step 1: Replace the shell**

Replace `hooks/community/useCreateCommunity.ts`:

```ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useCreateCommunityMutation } from "@/lib/queries/community/use-create-community-mutation";

/**
 * Shell over useCreateCommunityMutation. Preserves the public `createCommunity`
 * / `loading` / `error` / `setError` surface used by CreateCommunityModal.
 */
export const useCreateCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [error, setError] = useState("");
  const router = useRouter();
  const showToast = useCustomToast();
  const mutation = useCreateCommunityMutation();
  const loading = mutation.isPending;

  const onCreateCommunity = async (communityName: string, communityType: string) => {
    if (error) setError("");
    const format: RegExp = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (format.test(communityName)) {
      setError("Community name can only contain letters and numbers");
      return false;
    }
    if (communityName.length < 3) {
      setError("Community name must be at least 3 characters long");
      return false;
    }

    if (!user) {
      window.location.assign("/api/auth/start");
      return false;
    }

    try {
      await mutation.mutateAsync({ communityName, communityType });
      router.push(`/community/${communityName}`);
      return true;
    } catch (err: any) {
      console.log("Error: handleCreateCommunity", err);
      setError(err.message);
      showToast({
        title: "Community not Created",
        description: "There was an error creating your community",
        status: "error",
      });
      return false;
    }
  };

  return { createCommunity: onCreateCommunity, loading, error, setError };
};
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in. Open CreateCommunityModal, enter a valid name + type, submit. Expected: community is created, `router.push(/community/<name>)` navigates; on first render the new community is visible (a fresh community-detail mount). Open a separate tab to `/` — the home feed remount includes the new community in any list it renders. Devtools should show `community.list.*` and `community.snippets.<userId>` invalidating.

- [x] **Step 4: Commit**

```bash
git add hooks/community/useCreateCommunity.ts
git commit -m "refactor(community): route useCreateCommunity through useCreateCommunityMutation"
```

---

## Task 10: `useDeleteCommunityMutation` primitive

**Files:**
- Create: `lib/queries/community/use-delete-community-mutation.ts`
- Create: `__tests__/lib/queries/community/use-delete-community-mutation.test.tsx`

Wraps `deleteCommunityAction`. Invalidates `keys.community.list.*` (predicate), `keys.community.detail(id)`, `keys.community.snippets(userId)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-delete-community-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
  deleteCommunityAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { deleteCommunityAction } from "@/app/actions/community";
import { useDeleteCommunityMutation } from "@/lib/queries/community/use-delete-community-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useDeleteCommunityMutation", () => {
  it("calls deleteCommunityAction and invalidates list + detail + snippets", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCommunityMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({
        communityData: { id: "co1", creatorId: "u1", privacyType: "public", numberOfMembers: 1 } as any,
      });
    });

    expect(deleteCommunityAction).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
    expect(
      spy.mock.calls.some(([arg]) => "predicate" in (arg ?? {})),
    ).toBe(true);
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-delete-community-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-delete-community-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Community } from "@/types/community";

export type DeleteCommunityArgs = { communityData: Community };

export function useDeleteCommunityMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityData }: DeleteCommunityArgs) => deleteCommunityAction(communityData),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === "community" && q.queryKey[1] === "list",
      });
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityData.id) });
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-delete-community-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-delete-community-mutation.ts __tests__/lib/queries/community/use-delete-community-mutation.test.tsx
git commit -m "feat(queries): useDeleteCommunityMutation with list + detail + snippets invalidation"
```

---

## Task 11: Rewrite `useDeleteCommunity.ts` shell

**Files:**
- Modify (rewrite): `hooks/community/useDeleteCommunity.ts`

Preserves `{ deleteCommunity, loading }` surface. Router push and toasts stay.

- [x] **Step 1: Replace the shell**

Replace `hooks/community/useDeleteCommunity.ts`:

```ts
import { useRouter } from "next/navigation";
import { Community } from "@/types/community";
import useCustomToast from "../useCustomToast";
import { useDeleteCommunityMutation } from "@/lib/queries/community/use-delete-community-mutation";

/**
 * Shell over useDeleteCommunityMutation. Preserves `{ deleteCommunity, loading }`.
 */
const useDeleteCommunity = (communityData: Community) => {
  const router = useRouter();
  const showToast = useCustomToast();
  const mutation = useDeleteCommunityMutation();

  const onDeleteCommunity = async () => {
    try {
      await mutation.mutateAsync({ communityData });
      showToast({
        title: "Community Deleted",
        description: "Community has been deleted successfully",
        status: "success",
      });
      router.push("/");
    } catch (error) {
      console.log("Error: deleteCommunity", error);
      showToast({
        title: "Community not Deleted",
        description: "There was an error deleting the community",
        status: "error",
      });
    }
  };

  return { deleteCommunity: onDeleteCommunity, loading: mutation.isPending };
};

export default useDeleteCommunity;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in as the creator of a test community. Open community settings, delete it. Expected: success toast appears, router navigates to `/`. Visiting the deleted community URL returns 404. Devtools shows `community.list.*`, `community.detail.<id>`, `community.snippets.<userId>` invalidated.

- [x] **Step 4: Commit**

```bash
git add hooks/community/useDeleteCommunity.ts
git commit -m "refactor(community): route useDeleteCommunity through useDeleteCommunityMutation"
```

---

## Task 12: `useJoinCommunityMutation` primitive

**Files:**
- Create: `lib/queries/community/use-join-community-mutation.ts`
- Create: `__tests__/lib/queries/community/use-join-community-mutation.test.tsx`

Wraps `joinCommunityAction`. Invalidates `keys.community.snippets(userId)`, `keys.community.detail(id)`, `keys.community.members(id)`. No `setQueryData` — invalidation drives the refresh.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-join-community-mutation.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-join-community-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-join-community-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Community } from "@/types/community";

export type JoinCommunityArgs = { communityData: Community };

export function useJoinCommunityMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityData }: JoinCommunityArgs) => joinCommunityAction(communityData),
    onSuccess: (_data, vars) => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityData.id) });
      void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityData.id) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-join-community-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-join-community-mutation.ts __tests__/lib/queries/community/use-join-community-mutation.test.tsx
git commit -m "feat(queries): useJoinCommunityMutation with snippets + detail + members invalidation"
```

---

## Task 13: Rewrite `useJoinCommunity.tsx` shell

**Files:**
- Modify (rewrite): `hooks/community/useJoinCommunity.tsx`

Preserves `{ joinCommunity, joinLoading, joinError }` surface. Auth gate and toast stay. The `setQueryData` write on snippets and the manual `invalidateQueries(detail)` go away; the mutation owns both. The optimistic `setUi(currentCommunity.numberOfMembers++)` also goes away — invalidating `community.detail` refreshes the value canonically.

- [x] **Step 1: Replace the shell**

Replace `hooks/community/useJoinCommunity.tsx`:

```tsx
import { useState } from "react";
import { Community } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useJoinCommunityMutation } from "@/lib/queries/community/use-join-community-mutation";

const useJoinCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const [error, setError] = useState("");
  const mutation = useJoinCommunityMutation();

  const onJoinCommunity = async (communityData: Community) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      await mutation.mutateAsync({ communityData });
    } catch (err: any) {
      console.log("Error: joinCommunity", err);
      showToast({
        title: "Could not Subscribe",
        description: "There was an error subscribing to the community",
        status: "error",
      });
      setError(err.message);
    }
  };

  return {
    joinCommunity: onJoinCommunity,
    joinLoading: mutation.isPending,
    joinError: error,
  };
};

export default useJoinCommunity;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in. Visit a community you don't belong to, click Join. Expected: button flips to "Joined" within one round trip; member count in the header increments via `community.detail` invalidation (one network round trip — no optimistic UI). Navigate to a different community then back — member count remains correct. Devtools shows `community.snippets.<userId>`, `community.detail.<id>`, `community.members.<id>` invalidated.

- [x] **Step 4: Commit**

```bash
git add hooks/community/useJoinCommunity.tsx
git commit -m "refactor(community): route useJoinCommunity through useJoinCommunityMutation; drop setQueryData"
```

---

## Task 14: `useLeaveCommunityMutation` primitive

**Files:**
- Create: `lib/queries/community/use-leave-community-mutation.ts`
- Create: `__tests__/lib/queries/community/use-leave-community-mutation.test.tsx`

Wraps `leaveCommunityAction`. Same invalidation set as join: snippets, detail, members.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-leave-community-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
  leaveCommunityAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { leaveCommunityAction } from "@/app/actions/community";
import { useLeaveCommunityMutation } from "@/lib/queries/community/use-leave-community-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useLeaveCommunityMutation", () => {
  it("calls leaveCommunityAction and invalidates snippets + detail + members", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useLeaveCommunityMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ communityId: "co1" });
    });

    expect(leaveCommunityAction).toHaveBeenCalledWith("co1");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") });
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.members("co1") });
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-leave-community-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-leave-community-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type LeaveCommunityArgs = { communityId: string };

export function useLeaveCommunityMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityId }: LeaveCommunityArgs) => leaveCommunityAction(communityId),
    onSuccess: (_data, vars) => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
      void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-leave-community-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-leave-community-mutation.ts __tests__/lib/queries/community/use-leave-community-mutation.test.tsx
git commit -m "feat(queries): useLeaveCommunityMutation with snippets + detail + members invalidation"
```

---

## Task 15: Rewrite `useLeaveCommunity.tsx` shell

**Files:**
- Modify (rewrite): `hooks/community/useLeaveCommunity.tsx`

Preserves `{ leaveCommunity, leaveLoading, leaveError }`. Drops `setQueryData` and `setUi` numberOfMembers decrement (refreshed via invalidation).

- [x] **Step 1: Replace the shell**

Replace `hooks/community/useLeaveCommunity.tsx`:

```tsx
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useLeaveCommunityMutation } from "@/lib/queries/community/use-leave-community-mutation";

const useLeaveCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const [error, setError] = useState("");
  const mutation = useLeaveCommunityMutation();

  const onLeaveCommunity = async (communityId: string) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      await mutation.mutateAsync({ communityId });
    } catch (err: any) {
      console.log("Error: leaveCommunity", err.message);
      setError(err.message);
      showToast({
        title: "Could not Unsubscribe",
        description: "There was an error unsubscribing from the community",
        status: "error",
      });
    }
  };

  return {
    leaveCommunity: onLeaveCommunity,
    leaveLoading: mutation.isPending,
    leaveError: error,
  };
};

export default useLeaveCommunity;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in. Visit a community you belong to (but didn't create), click Leave. Expected: button flips to "Join" within one round trip; member count in the header decrements via `community.detail` invalidation.

- [x] **Step 4: Commit**

```bash
git add hooks/community/useLeaveCommunity.tsx
git commit -m "refactor(community): route useLeaveCommunity through useLeaveCommunityMutation; drop setQueryData"
```

---

## Task 16: `useCommunityPrivacyMutation` primitive

**Files:**
- Create: `lib/queries/community/use-community-privacy-mutation.ts`
- Create: `__tests__/lib/queries/community/use-community-privacy-mutation.test.tsx`

Wraps `updateCommunityPrivacyAction`. Invalidates `keys.community.detail(id)`.

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-community-privacy-mutation.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-community-privacy-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-community-privacy-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommunityPrivacyAction } from "@/app/actions/community";
import { keys } from "@/lib/queries/keys";

export type CommunityPrivacyArgs = { communityId: string; privacyType: string };

export function useCommunityPrivacyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, privacyType }: CommunityPrivacyArgs) =>
      updateCommunityPrivacyAction(communityId, privacyType),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-community-privacy-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-community-privacy-mutation.ts __tests__/lib/queries/community/use-community-privacy-mutation.test.tsx
git commit -m "feat(queries): useCommunityPrivacyMutation with community.detail invalidation"
```

---

## Task 17: Rewrite `useCommunityPrivacy.ts` shell

**Files:**
- Modify (rewrite): `hooks/community/useCommunityPrivacy.ts`

Preserves `{ updatePrivacyType }`. Drops the `setUi` optimistic mirror (refreshed via invalidation) and the manual `invalidateQueries` call (mutation owns it now).

- [x] **Step 1: Replace the shell**

Replace `hooks/community/useCommunityPrivacy.ts`:

```ts
import { Community } from "@/types/community";
import useCustomToast from "../useCustomToast";
import { useCommunityPrivacyMutation } from "@/lib/queries/community/use-community-privacy-mutation";

const useCommunityPrivacy = (communityData: Community) => {
  const showToast = useCustomToast();
  const mutation = useCommunityPrivacyMutation();

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await mutation.mutateAsync({ communityId: communityData.id, privacyType });
    } catch (error) {
      console.log("Error: onUpdateCommunityPrivacyType", error);
      showToast({
        title: "Privacy Type not Updated",
        description: "There was an error updating the community privacy type",
        status: "error",
      });
    }
  };

  return { updatePrivacyType };
};

export default useCommunityPrivacy;
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Smoke in browser**

Sign in as a community admin. Open Community Settings → change privacy from public → restricted. Expected: setting persists; refreshing the community header shows the new badge within one round trip (via `community.detail` invalidation).

- [x] **Step 4: Commit**

```bash
git add hooks/community/useCommunityPrivacy.ts
git commit -m "refactor(community): route useCommunityPrivacy through useCommunityPrivacyMutation"
```

---

## Task 18: New `useCommunityMembersListQuery` (subscriptive read)

**Files:**
- Create: `lib/queries/community/use-community-members-list.ts`

Replaces `hooks/community/useCommunityMembers.ts`'s `fetchQuery + useState` pattern. Required so `useRemoveCommunityMemberMutation` invalidation actually refreshes the mounted modal.

- [x] **Step 1: Write the query primitive**

Create `lib/queries/community/use-community-members-list.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { CommunityMember } from "@/types/communityMember";

export function useCommunityMembersListQuery({
  communityId,
  enabled = true,
}: {
  communityId: string;
  enabled?: boolean;
}) {
  return useQuery<CommunityMember[]>({
    queryKey: keys.community.members(communityId),
    queryFn: () => fetchCommunityMembersAction(communityId),
    enabled: enabled && !!communityId,
  });
}
```

- [x] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Commit**

```bash
git add lib/queries/community/use-community-members-list.ts
git commit -m "feat(queries): useCommunityMembersListQuery (subscriptive read)"
```

---

## Task 19: `useRemoveCommunityMemberMutation` primitive

**Files:**
- Create: `lib/queries/community/use-remove-community-member-mutation.ts`
- Create: `__tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx`

Wraps `removeCommunityMemberAction`. Invalidates `keys.community.members(id)` and `keys.community.snippets(memberId)` (the removed user's snippet list — drops the community they were just kicked from).

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/app/actions/community", () => ({
  removeCommunityMemberAction: vi.fn(async () => undefined),
}));

import { removeCommunityMemberAction } from "@/app/actions/community";
import { useRemoveCommunityMemberMutation } from "@/lib/queries/community/use-remove-community-member-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useRemoveCommunityMemberMutation", () => {
  it("calls removeCommunityMemberAction and invalidates members + removed-user snippets", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useRemoveCommunityMemberMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ communityId: "co1", memberId: "u2" });
    });

    expect(removeCommunityMemberAction).toHaveBeenCalledWith("co1", "u2");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.members("co1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u2") });
  });
});
```

- [x] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx
```

Expected: FAIL — module not found.

- [x] **Step 3: Write the primitive**

Create `lib/queries/community/use-remove-community-member-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeCommunityMemberAction } from "@/app/actions/community";
import { keys } from "@/lib/queries/keys";

export type RemoveCommunityMemberArgs = { communityId: string; memberId: string };

export function useRemoveCommunityMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, memberId }: RemoveCommunityMemberArgs) =>
      removeCommunityMemberAction(communityId, memberId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityId) });
      void qc.invalidateQueries({ queryKey: keys.community.snippets(vars.memberId) });
    },
  });
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/queries/community/use-remove-community-member-mutation.ts __tests__/lib/queries/community/use-remove-community-member-mutation.test.tsx
git commit -m "feat(queries): useRemoveCommunityMemberMutation with members + snippets invalidation"
```

---

## Task 20: Rewrite `useRemoveCommunityMember.ts` shell + `CommunityMembersModal.tsx`; delete `useCommunityMembers.ts`

**Files:**
- Modify (rewrite): `hooks/community/useRemoveCommunityMember.ts`
- Delete: `hooks/community/useCommunityMembers.ts`
- Modify: `components/modal/community-members/CommunityMembersModal.tsx`

- [ ] **Step 1: Replace `hooks/community/useRemoveCommunityMember.ts`**

Replace with:

```ts
import useCustomToast from "../useCustomToast";
import { useRemoveCommunityMemberMutation } from "@/lib/queries/community/use-remove-community-member-mutation";

/**
 * Shell over useRemoveCommunityMemberMutation. Preserves the `{ removeMember,
 * loading }` surface and the success/failure toasts.
 */
const useRemoveCommunityMember = () => {
  const showToast = useCustomToast();
  const mutation = useRemoveCommunityMemberMutation();

  const removeMember = async (communityId: string, memberId: string) => {
    try {
      await mutation.mutateAsync({ communityId, memberId });
      showToast({
        title: "User removed",
        description: "The user has been removed from the community.",
        status: "success",
      });
      return true;
    } catch (error: any) {
      console.error("Error removing member", error);
      showToast({
        title: "Error removing member",
        description: error.message,
        status: "error",
      });
      return false;
    }
  };

  return { removeMember, loading: mutation.isPending };
};

export default useRemoveCommunityMember;
```

- [ ] **Step 2: Delete `hooks/community/useCommunityMembers.ts`**

```bash
rm hooks/community/useCommunityMembers.ts
```

- [ ] **Step 3: Update `components/modal/community-members/CommunityMembersModal.tsx`**

Three changes:

1. Replace the import:

```diff
-import useCommunityMembers from "@/hooks/community/useCommunityMembers";
+import { useCommunityMembersListQuery } from "@/lib/queries/community/use-community-members-list";
```

2. Replace the `useCommunityMembers` destructure (line 49) and the `useEffect`-driven `loadMembers` call (lines 56-59) with:

```tsx
  const membersQuery = useCommunityMembersListQuery({
    communityId,
    enabled: isOpen,
  });
  const members = membersQuery.data ?? [];
  const loading = membersQuery.isLoading;
  const error = membersQuery.error;
```

Delete the entire `useEffect(() => { if (!isOpen) return; loadMembers(communityId); }, [...])` block.

3. Replace the body of `handleRemoveMember` (lines 61-66) to drop the manual reload — invalidation handles it:

```diff
   const handleRemoveMember = async (memberId: string) => {
-    const success = await removeMember(communityId, memberId);
-    if (success) {
-      loadMembers(communityId);
-    }
+    await removeMember(communityId, memberId);
   };
```

The `removeMember` mutation already invalidates `keys.community.members(communityId)`, which the subscriptive `useCommunityMembersListQuery` picks up automatically.

The error fallback rendering at the bottom of `renderContent` (around line 87) needs no change — `error` is truthy/falsy either way, so `{error ? "Failed to load subscribers." : "No subscribers found."}` still works whether `error` is the previous `string | null` or the query's `Error | null`.

- [ ] **Step 4: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 5: Run community tests**

```bash
pnpm test __tests__/lib/queries/community
```

Expected: PASS — all new mutation tests.

- [ ] **Step 6: Smoke in browser**

Sign in as a community admin. Open Community Members modal. Expected: members list loads automatically. Click remove on a member, confirm the dialog. Expected: member disappears from the list within one round trip (no manual `loadMembers` call). Devtools shows `community.members.<id>` and `community.snippets.<memberId>` invalidated.

- [ ] **Step 7: Commit**

```bash
git add hooks/community/useRemoveCommunityMember.ts components/modal/community-members/CommunityMembersModal.tsx
git rm hooks/community/useCommunityMembers.ts
git commit -m "refactor(community): route useRemoveCommunityMember through TanStack; modal subscribes via useCommunityMembersListQuery"
```

---

## Task 21: `useCommunityImageMutation` primitives (upload + delete)

**Files:**
- Create: `lib/queries/community/use-community-image-mutation.ts`
- Create: `__tests__/lib/queries/community/use-community-image-mutation.test.tsx`

Two mutations sharing one file. Upload wraps the `uploadImage` helper for `community-image`; Delete wraps `deleteCommunityImageAction`. Both invalidate `keys.community.detail(id)` and `keys.community.snippets(userId)`. Upload returns the new `imageUrl` so the shell can refresh `currentCommunity` for callers reading from `uiAtom`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/community/use-community-image-mutation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/upload/uploadImage", () => ({
  uploadImage: vi.fn(async () => ({ imageUrl: "https://cdn/example.jpg" })),
}));

vi.mock("@/app/actions/community", () => ({
  deleteCommunityImageAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";
import {
  useUploadCommunityImageMutation,
  useDeleteCommunityImageMutation,
} from "@/lib/queries/community/use-community-image-mutation";
import { keys } from "@/lib/queries/keys";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("useUploadCommunityImageMutation", () => {
  it("calls uploadImage and invalidates community.detail + snippets", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUploadCommunityImageMutation(), { wrapper: wrap(client) });
    const fakeBlob = new Blob(["x"], { type: "image/jpeg" });

    let returned: any;
    await act(async () => {
      returned = await result.current.mutateAsync({ communityId: "co1", blob: fakeBlob });
    });

    expect(uploadImage).toHaveBeenCalledWith("community-image", fakeBlob, "co1");
    expect(returned).toEqual({ imageUrl: "https://cdn/example.jpg" });
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
  });
});

describe("useDeleteCommunityImageMutation", () => {
  it("calls deleteCommunityImageAction and invalidates community.detail + snippets", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCommunityImageMutation(), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync({ communityId: "co1" });
    });

    expect(deleteCommunityImageAction).toHaveBeenCalledWith("co1");
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.detail("co1") }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: keys.community.snippets("u1") });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/community/use-community-image-mutation.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the primitives**

Create `lib/queries/community/use-community-image-mutation.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type UploadCommunityImageArgs = { communityId: string; blob: Blob };

export function useUploadCommunityImageMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityId, blob }: UploadCommunityImageArgs) =>
      uploadImage("community-image", blob, communityId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
    },
  });
}

export type DeleteCommunityImageArgs = { communityId: string };

export function useDeleteCommunityImageMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ communityId }: DeleteCommunityImageArgs) =>
      deleteCommunityImageAction(communityId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
      }
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/community/use-community-image-mutation.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/community/use-community-image-mutation.ts __tests__/lib/queries/community/use-community-image-mutation.test.tsx
git commit -m "feat(queries): useUpload/DeleteCommunityImageMutation with detail + snippets invalidation"
```

---

## Task 22: Rewrite `useCommunityImage.ts` shell

**Files:**
- Modify (rewrite): `hooks/community/useCommunityImage.ts`

Preserves `{ updateImage, deleteCommunityImage, uploadingImage }` surface. Drops the `setUi(currentCommunity.imageUrl)` and `setQueryData(snippets)` writes — invalidation refreshes both `community.detail` (which `currentCommunity` mirrors via the SSR-hydrated `useEffect` in PostClientPage / detail page) and `community.snippets`. The mirror to `uiAtom.currentCommunity` was a UI optimism layer; without it there's a one-round-trip delay before the header image refreshes, identical to other community fields after C3.

- [ ] **Step 1: Replace the shell**

Replace `hooks/community/useCommunityImage.ts`:

```ts
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community } from "@/types/community";
import {
  useUploadCommunityImageMutation,
  useDeleteCommunityImageMutation,
} from "@/lib/queries/community/use-community-image-mutation";

const useCommunityImage = (communityData: Community) => {
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const uploadMutation = useUploadCommunityImageMutation();
  const deleteMutation = useDeleteCommunityImageMutation();

  const onUpdateImage = async (blob: Blob) => {
    if (!blob) return;
    setUploadingImage(true);
    try {
      await uploadMutation.mutateAsync({ communityId: communityData.id, blob });
    } catch (err) {
      console.log("Error: onUploadImage", err);
      showToast({
        title: "Image not Updated",
        description: err instanceof Error ? err.message : "There was an error updating the image",
        status: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onDeleteCommunityImage = async () => {
    try {
      await deleteMutation.mutateAsync({ communityId: communityData.id });
    } catch (error) {
      console.log("Error: onDeleteCommunityImage", error);
      showToast({
        title: "Image not Deleted",
        description: "There was an error deleting the image",
        status: "error",
      });
    }
  };

  return {
    updateImage: onUpdateImage,
    deleteCommunityImage: onDeleteCommunityImage,
    uploadingImage,
  };
};

export default useCommunityImage;
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Smoke in browser**

Sign in as a community admin. Open Community Settings → Update Image, crop and submit. Expected: image upload succeeds; after one round trip the new image appears in the community header. Delete the image — same one-round-trip refresh.

- [ ] **Step 4: Commit**

```bash
git add hooks/community/useCommunityImage.ts
git commit -m "refactor(community): route useCommunityImage through Upload/DeleteCommunityImageMutation"
```

---

# Group 4 — Profile

## Task 23: `useProfileMutations` primitives (upload image + remove image + update name)

**Files:**
- Create: `lib/queries/profile/use-profile-mutations.ts`
- Create: `__tests__/lib/queries/profile/use-profile-mutations.test.tsx`

Three mutations sharing one file. All invalidate `keys.profile(userId)` per parent spec §6. Upload wraps the `uploadImage` helper for `profile-image`; Remove wraps `removeProfileImageAction`; UpdateName wraps `profileNameAction`. None of the mutations call `router.refresh()` directly — that stays in the shell since the profile data is read from server components, not a TanStack query (see Known Limitation #5).

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/profile/use-profile-mutations.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm test __tests__/lib/queries/profile/use-profile-mutations.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the primitives**

Create `lib/queries/profile/use-profile-mutations.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload/uploadImage";
import { profileNameAction, removeProfileImageAction } from "@/app/actions/profile";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type UploadProfileImageArgs = { blob: Blob };

export function useUploadProfileImageMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ blob }: UploadProfileImageArgs) => uploadImage("profile-image", blob),
    onSuccess: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.profile(userId) });
      }
    },
  });
}

export function useRemoveProfileImageMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: () => removeProfileImageAction(),
    onSuccess: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.profile(userId) });
      }
    },
  });
}

export type UpdateProfileNameArgs = { name: string };

export function useUpdateProfileNameMutation() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  return useMutation({
    mutationFn: ({ name }: UpdateProfileNameArgs) => profileNameAction(name),
    onSuccess: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: keys.profile(userId) });
      }
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test __tests__/lib/queries/profile/use-profile-mutations.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/profile/use-profile-mutations.ts __tests__/lib/queries/profile/use-profile-mutations.test.tsx
git commit -m "feat(queries): useUpload/Remove ProfileImage + UpdateProfileName mutations with profile invalidation"
```

---

## Task 24: Rewrite `useUserProfile.ts` shell

**Files:**
- Modify (rewrite): `hooks/useUserProfile.ts`

Preserves `{ updateImage, removeImage, updateName, loading }` surface used by `ProfileModal.tsx`. `router.refresh()` calls stay (profile data lives in server components today; the TanStack invalidation is forward-compatible plumbing — see Known Limitation #5).

- [ ] **Step 1: Replace the shell**

Replace `hooks/useUserProfile.ts`:

```ts
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import useCustomToast from "./useCustomToast";
import {
  useUploadProfileImageMutation,
  useRemoveProfileImageMutation,
  useUpdateProfileNameMutation,
} from "@/lib/queries/profile/use-profile-mutations";

/**
 * Shell over the three profile mutations. Preserves the
 * `{ updateImage, removeImage, updateName, loading }` surface used by
 * ProfileModal. router.refresh() is retained because profile data is read
 * from server components today; the mutation invalidation hits
 * keys.profile(userId), which is forward-compatible plumbing for when a
 * useProfileQuery consumer lands.
 */
const useUserProfile = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const showToast = useCustomToast();
  const uploadMutation = useUploadProfileImageMutation();
  const removeMutation = useRemoveProfileImageMutation();
  const nameMutation = useUpdateProfileNameMutation();

  const loading =
    uploadMutation.isPending || removeMutation.isPending || nameMutation.isPending;

  const updateImage = async (blob: Blob) => {
    if (!user) return false;
    try {
      await uploadMutation.mutateAsync({ blob });
      router.refresh();
      showToast({
        title: "Profile updated",
        description: "Your profile image has been updated",
        status: "success",
      });
      return true;
    } catch (err) {
      console.error("Error: updateImage:", err);
      showToast({
        title: "Image not Updated",
        description: err instanceof Error ? err.message : "Failed to upload image",
        status: "error",
      });
      return false;
    }
  };

  const removeImage = async () => {
    if (!user) return false;
    try {
      await removeMutation.mutateAsync();
      router.refresh();
      showToast({
        title: "Profile updated",
        description: "Your profile image has been removed",
        status: "success",
      });
      return true;
    } catch (error) {
      console.error("Error: removeImage: ", error);
      showToast({
        title: "Image not Deleted",
        description: "Failed to delete profile image",
        status: "error",
      });
      return false;
    }
  };

  const updateName = async (userName: string) => {
    if (!user) return false;
    try {
      await nameMutation.mutateAsync({ name: userName });
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error: updateName: ", error);
      showToast({
        title: "Name not Updated",
        description: "Failed to update profile name",
        status: "error",
      });
      return false;
    }
  };

  return { updateImage, removeImage, updateName, loading };
};

export default useUserProfile;
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Smoke in browser**

Sign in. Open Profile modal. Update display name — toast appears; refresh and the name persists. Update profile image (crop + submit) — toast appears; image renders in the header after `router.refresh()`. Remove the image — toast appears; default avatar returns.

- [ ] **Step 4: Commit**

```bash
git add hooks/useUserProfile.ts
git commit -m "refactor(profile): route useUserProfile through profile mutations"
```

---

# Final green-gate verification

## Task 25: Full green gate

**Files:** none modified.

Run the full mutations-PR green gate. Fix any breakage before merging the branch.

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: all green, including the 12 new mutation tests under `__tests__/lib/queries/{comments,admin,community,profile}/`.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Lint**

```bash
pnpm eslint
```

Expected: clean. Specifically confirm:
- No new `// eslint-disable-next-line react-hooks/set-state-in-effect` suppressions were added.
- The previous suppression on `hooks/comments/useCommentList.ts:26` is **gone** (the mirror was removed in Task 3).
- Remaining suppressions are: `app/providers.tsx:23` (unrelated), `hooks/useSearch.tsx:22` (debounce reset), `hooks/community/useCommunitiesFeed.ts:71` and `hooks/posts/usePostsFeed.ts:85` (paging/UI-state resets — feed shells), `components/modal/image-crop/ImageCropModal.tsx:65` (modal reset), `app/community/[communityId]/comments/[pid]/PostClientPage.tsx:56,66` (SSR hydration mirrors). These are all legitimate non-fetch resets that survive into C4.

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: clean.

- [ ] **Step 5: Smoke checklist (browser, signed in)**

Run through each manually. These cover the full C3 invalidation contract for the four remaining groups:

**Comments:**
- [ ] Post a top-level comment on a post you can comment on → appears within one round trip; post header `numberOfComments` increments
- [ ] Reply to an existing comment → appears as a child
- [ ] Delete a comment with replies → all descendants disappear (server cascades); count decrements

**Admin:**
- [ ] Open `AdminManager` for a community you admin → list loads automatically
- [ ] Add an admin by email → list updates within one round trip
- [ ] Remove an admin → list updates within one round trip

**Community:**
- [ ] Create a new community → `router.push` lands on the community page; community visible in lists
- [ ] Join a community → button flips; member count refreshes (one round trip)
- [ ] Leave a community → button flips; member count decrements
- [ ] Change community privacy → header badge updates after a round trip
- [ ] Update community image → header image refreshes after a round trip
- [ ] Delete community image → header reverts to default after a round trip
- [ ] Remove a member from `CommunityMembersModal` → member disappears without a manual reload
- [ ] Delete a community (as creator) → success toast; `router.push("/")`; community URL 404s

**Profile:**
- [ ] Update display name in profile modal → persists after `router.refresh()`
- [ ] Upload profile image → renders in header after `router.refresh()`
- [ ] Remove profile image → default avatar returns after `router.refresh()`

**Devtools spot checks (React Query Devtools, dev only):**
- [ ] On each action above, confirm the keys in the invalidation contract (top of this plan) flip to "fetching/stale"

- [ ] **Step 6: Commit any test/lint fixes**

If steps 1–4 surfaced issues that required code tweaks, commit them with a descriptive message. If no fixes were needed, skip this step.

```bash
git status
```

Expected: clean tree.

---

## Out of scope (recorded for follow-up)

- **C4 cleanup + perf re-measure.** Decide per-hook whether legacy shells stay or are inlined at call sites; re-measure the perf baseline doc from C1 with after-numbers and deltas. Own plan.
- **Optimistic UI** for vote / join / save / image-upload mutations — backlog item already filed (`docs/superpowers/backlog.md`).
- **`useInfiniteQuery` refactor** of `usePostsFeed` and `useCommunitiesFeed` — backlog. Would make `community.list.*` invalidation refresh the currently-mounted home/discovery view in place.
- **`useProfileQuery` consumer.** Profile data is still read from server components + `useSession()`. When a TanStack consumer lands, `useUserProfile.ts` can drop its `router.refresh()` calls because `keys.profile(userId)` invalidation will already drive the refresh.
- **`posts.votes` key shape** drift carried from C3 posts PR — separate decision.
