# Phase C3 — Mutations + invalidation (modified) (design)

**Status:** Spec
**Date:** 2026-05-20
**Predecessor:** Phase C2 (reads + hydration, merged on `feat/phase-c-tanstack-query`; atom decomposition included)
**Parent spec:** [2026-05-20-forum-phase-c-tanstack-query-design.md](./2026-05-20-forum-phase-c-tanstack-query-design.md)
**Successor:** Phase C4 (cleanup + handoff)

## 1. Goal

Convert the 14 mutation hooks under `hooks/{admin,comments,community,posts}` and `hooks/useUserProfile.ts` to `useMutation` primitives under `lib/queries/*`, wired to the invalidation map in parent spec §6. After C3, every server-state change in the forum flows through TanStack Query's mutation pipeline and corresponding queries refresh without any manual `refetch` / `setState` calls in component code.

## 2. What "modified" means

The parent spec scheduled C3 as a single ~1.5-day PR for all 14 mutations. This document replaces that with a sequenced delivery plan, in light of two facts that became true during C2:

1. **Atom decomposition is done.** `postsAtom`, `communitiesAtom`, `savedPostsAtom`, and `directoryMenuAtom` have been deleted; `uiAtom.ts` is the only remaining atom and holds UI state only. Every consumer of *server* state already reads from a `useXxxQuery` hook. **Consequence:** mutation primitives do not need transitional atom-mirroring shells; a single `invalidateQueries(...)` propagates the change to every consumer.
2. **C2 landed as one large PR.** The review burden was real. Splitting C3 by group keeps each PR small enough to review confidently.

Everything else from the parent spec stands: the queryKey factory (§4.3), the queryFn-is-server-action rule (§4.4), the invalidation map (§6), the testing strategy (§10), and the deferral of optimistic UI (§12).

## 3. Approach

**Same shell pattern as C2.** For each mutation:

- A new primitive at `lib/queries/<group>/use-<name>-mutation.ts` owns the `useMutation` config and the invalidation contract.
- The existing legacy hook under `hooks/<group>/use<Name>.tsx` is rewritten to delegate to the primitive while preserving its exported call surface (`onXxx`, `loading`, `error`). Router redirects, toasts, modal coordination, and auth gating stay in the shell.
- Component call sites do not change.

The shell pattern was rejected for "rewrite call sites directly" because the latter would touch every consumer of every mutation hook and balloon the diff. Shells retire (or get inlined) in C4 cleanup, identically to C2 read shells.

**Optimistic UI is out of scope** (parent spec §12). Every mutation: `action call → await success → invalidate`. Optimistic vote / save ship as follow-ups if profiling shows latency matters.

## 4. PR slicing

C3 ships as five sequenced PRs. Each gets its own implementation plan, its own green gate, and its own brainstorm before planning (groups differ enough — for example, `useJoinCommunity` invalidates three caches; `useDeleteComment` invalidates two — that one mega-plan would hide per-group decisions).

| Order | Group | Mutations | Hook files |
|---|---|---|---|
| 1 (this spec's plan) | **posts** | `usePostVote`, `useCreatePost`, `useDeletePost`, save/unsave | `usePostVote.tsx`, `useCreatePost.ts`, `usePostDeletion.ts`, `useSavedPosts.tsx` (mutation half) |
| 2 | comments | `useCreateComment`, `useDeleteComment` | `useCreateComment.ts`, `useDeleteComment.ts` |
| 3 | admin | `useAddAdmin`, `useRemoveAdmin` | `useAddAdmin.ts`, `useRemoveAdmin.ts` |
| 4 | community | create, delete, join, leave, privacy, remove-member, image-upload | `useCreateCommunity.ts`, `useDeleteCommunity.ts`, `useJoinCommunity.tsx`, `useLeaveCommunity.tsx`, `useCommunityPrivacy.ts`, `useRemoveCommunityMember.ts`, `useCommunityImage.ts` |
| 5 | profile | `useUserProfile.uploadImage` | `useUserProfile.ts` |

Posts is first because votes and saved-toggle are the hottest-path mutations from parent spec §2's perf hypotheses; getting them onto invalidation-driven refresh is the highest-value early payoff.

## 5. Posts PR — detailed scope

### 5.1 Files

**New primitives:**
- `lib/queries/posts/use-post-vote.ts` → exports `usePostVoteMutation`
- `lib/queries/posts/use-create-post.ts` → exports `useCreatePostMutation`
- `lib/queries/posts/use-delete-post.ts` → exports `useDeletePostMutation`
- `lib/queries/posts/use-saved-posts-mutation.ts` → exports `useSavePostMutation` and `useUnsavePostMutation`

**Rewritten shells (public surface preserved):**
- `hooks/posts/usePostVote.tsx`
- `hooks/posts/useCreatePost.ts`
- `hooks/posts/usePostDeletion.ts`
- `hooks/posts/useSavedPosts.tsx` (mutation half only — read half landed in C2)

**New tests:**
- `__tests__/lib/queries/posts/use-post-vote.test.tsx`
- `__tests__/lib/queries/posts/use-create-post.test.tsx`
- `__tests__/lib/queries/posts/use-delete-post.test.tsx`
- `__tests__/lib/queries/posts/use-saved-posts-mutation.test.tsx`

### 5.2 Invalidation contract (from parent spec §6)

| Mutation | Invalidates |
|---|---|
| `usePostVoteMutation` | `keys.posts.detail(postId)`, `keys.posts.feed.*` (predicate), `keys.posts.votes(communityId)` |
| `useCreatePostMutation` | `keys.posts.feed.*` (predicate) |
| `useDeletePostMutation` | `keys.posts.feed.*` (predicate), `keys.posts.detail(postId)` |
| `useSavePostMutation` / `useUnsavePostMutation` | `keys.posts.saved(userId)` |

"Predicate" invalidation pattern:
```ts
qc.invalidateQueries({
  predicate: (q) =>
    q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
});
```
This catches every parametrized feed key (different scopes, different cursors) without enumerating them.

Note on `posts.votes`: the parent spec keys this by `userId`. In the actual code shipped in C2, the votes query is keyed by `communityId` (because vote rows are scoped to a community in the action). The invalidation predicate above uses the live key. This drift is recorded as a follow-up in §10.

### 5.3 Shell shape (illustrative — `usePostVote.tsx`)

```ts
"use client";

import { useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import useCustomToast from "../useCustomToast";

const usePostVote = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const mutation = usePostVoteMutation();

  const onVote = useCallback(
    async (post, vote, communityId) => {
      if (!user) {
        window.location.assign("/api/auth/start");
        return;
      }
      try {
        await mutation.mutateAsync({ post, vote, communityId });
      } catch (error) {
        console.log("onVote error", error);
        showToast({ title: "Vote failed", status: "error" });
      }
    },
    [user, mutation, showToast],
  );

  return { onVote, loading: mutation.isPending };
};

export default usePostVote;
```

Other shells follow the same pattern. `useSavedPosts.tsx` keeps its `useSavedPostsQuery` read (from C2) and adds the two mutations; the shell file's exported surface (`onSavePost`, `onRemoveSavedPost`, `isPostSaved`, `fetchSavedPosts`, `savedPostState`, `loading`) stays identical.

### 5.4 Test pattern

Each mutation test:
1. Mounts a `<Probe />` component with `renderWithProviders` that calls the relevant query and the mutation.
2. Asserts initial query data.
3. Fires the mutation via `act(() => ...)`.
4. Asserts the query observes updated data (proves invalidation propagated).
5. Mocks the server action; never hits a real DB.

Reference: parent spec §10 and `__tests__/helpers/renderWithProviders.tsx` (added in C2 Task 1).

### 5.5 Posts PR green gate

- `pnpm test` — green; four new mutation tests included
- `pnpm typecheck` — clean
- `pnpm lint` — clean; no new `react-hooks/set-state-in-effect` suppressions added
- `pnpm build` — clean
- Manual smoke in browser, signed in:
  - Upvote / downvote a post — vote count + colour update without refresh
  - Submit a new post via `/community/[id]/submit` — appears at top of the feed after redirect
  - Delete a post — disappears from feed and 404s on its detail URL
  - Save and unsave a post — saved list updates on the next visit

## 6. Out of scope

- Mutations in groups 2–5 (comments, admin, community, profile). Each gets its own brainstorm + plan in sequence.
- Optimistic updates (parent spec §12).
- `useInfiniteQuery` refactor (parent spec §12).
- Performance re-measurement — happens in C4.
- Shell retirement / inlining at call sites — C4.

## 7. Non-goals

- No new server actions (existing actions in `app/actions/posts.ts` are the `mutationFn` targets).
- No schema changes.
- No auth changes.
- No optimistic UI, no rollback logic.
- No component-level diffs.

## 8. Testing strategy (recap)

- Per-mutation test: query + mutation co-rendered; mutation fires; query observes fresh data.
- Re-use `renderWithProviders` (C2 Task 1).
- Server-action mocks: `vi.mock("@/app/actions/posts", () => ({ ... }))`.
- No HydrationBoundary tests in this phase (those landed in C2).

## 9. Risks

- **Predicate invalidation footgun.** A predicate that's too loose invalidates more than intended; too tight misses keys. The test pattern (assert the *expected query observes fresh data*) catches "too tight". A future per-PR review pass should also confirm no unrelated query was invalidated.
- **Shell call-site drift.** If any component calls a hook field that the shell drops or renames during rewrite, runtime breaks. Mitigation: type the shell's return type explicitly and run `pnpm typecheck` before manual smoke.
- **Toast / router behaviour regressions.** Side effects in the old shells (redirects after delete, confirm-modal close, etc.) live in the shell after rewrite. The smoke checklist above catches the obvious cases; subtle ones (e.g., toast suppressed for a specific error code) need a careful read of each shell during rewrite.

## 10. Follow-ups

- **`posts.votes` key shape.** Parent spec keys it by `userId`; actual code keys by `communityId`. Decide post-C3 whether to migrate to per-user-per-community (`(userId, communityId)`) or leave as-is and update the parent spec to match reality. Tracked in `docs/superpowers/backlog.md`.
- **Decide per-hook in C4** whether each shell stays as a documented convenience wrapper or gets inlined at call sites.

## 11. Open questions

None at design time.
