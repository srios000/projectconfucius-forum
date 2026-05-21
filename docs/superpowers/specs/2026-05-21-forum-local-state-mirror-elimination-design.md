# Forum local-state mirror elimination (design)

Status: brainstormed 2026-05-21. Implementation plan pending.

## Summary

Eliminate every `useEffect` that mirrors TanStack-Query-owned server state into local React state or jotai atoms. The forum has been migrating to TanStack Query through Phase C (foundation → reads → mutations). Phase C deferred two cleanups to the backlog: (1) optimistic UI for vote/delete, (2) `useInfiniteQuery` for the posts feed. This spec executes both, then capitalizes on them to delete the two remaining `uiAtom` server-state mirrors (`selectedPost`, `currentCommunity`) and the local `posts: Post[]` `useState` they exist to serve.

Net effect: zero `useEffect`s that synchronize React state with server state. `usePostsFeed` deleted (replaced by `useInfiniteQuery`). `usePostState` deleted. `uiAtom` shrinks to genuinely client-only UI state.

## Motivation

- The lint pass on 2026-05-21 surfaced one error (`react-hooks/set-state-in-effect`) and 12 warnings, most of which are downstream symptoms of the mirror pattern. Suppressing them with `eslint-disable` lines hides the architectural smell instead of fixing it.
- The mirror pattern forces every page that lists posts (`HomePageClient`, `Posts`, `PostClientPage`) to maintain a local `posts: Post[]` `useState` and to wire `setPosts` into `usePostVote` and `usePostDeletion` for optimistic updates. This is the React-circa-2018 pattern that TanStack Query exists to replace.
- The `uiAtom.selectedPost` mirror duplicates the canonical `usePostQuery` cache. Five hooks (`usePostVote`, `useCreateComment`, `useDeleteComment`, `usePostSelection`, `usePostState`) touch it in coordinated ways; this is the inverse of "single source of truth."
- The `uiAtom.currentCommunity` mirror has 15 consumers across the app. The atom is written by mirror effects on `PostClientPage` and `CommunityClientPage`, then read everywhere — a hidden global that the route already encodes via `[communityId]`.
- The most recent C3 plan ([2026-05-21-forum-phase-c3-remaining-mutations.md §"Known limitations going in"](../plans/2026-05-21-forum-phase-c3-remaining-mutations.md)) explicitly carves both the optimistic-UI work and the `useInfiniteQuery` migration as backlog items. This plan IS that backlog work.

## Out of scope

- Optimistic UI for `join` / `save` / `subscribe` / community-CRUD mutations. Parent spec §12 keeps the "await → invalidate" contract for those. Only `vote` and `delete-post` move to optimistic in this PR.
- `useCommunitiesFeed` migration to `useInfiniteQuery`. Listed as a separate backlog item in C3 plan limitation #2.
- Profile read query. Parent spec known limitation #5; `useProfileQuery` does not exist and no consumer needs it yet.
- Server actions, database schema, auth flow — none touched.
- Comment-related local-state cleanup beyond the `numberOfComments` count bump path. `useCommentList`'s `setComments` mirror was already removed in C3 PR 1.
- The non-architectural lint warnings: `<img>` in `ImageCropModal`, RHF `watch()` in `CommentInput`/`AdminManager`/`CreateCommunityModal`. These are addressed in the final lint-sweep commit but are not the goal.

## Current state (what exists today)

### Mirror sources

**Local `posts: Post[]` `useState`** in three sites:
- [`app/HomePageClient.tsx`](../../../app/HomePageClient.tsx) — fed by `usePostsFeed`, mutated by `usePostVote`/`usePostDeletion` via passed-in `setPosts`.
- [`components/posts/Posts.tsx`](../../../components/posts/Posts.tsx) — same pattern, scoped to a single community.
- [`app/community/[communityId]/comments/[pid]/PostClientPage.tsx`](../../../app/community/%5BcommunityId%5D/comments/%5Bpid%5D/PostClientPage.tsx) — a degenerate "list of one"; populated by a `useEffect` mirror from `usePostQuery`.

**`uiAtom.selectedPost`** (eight write/read sites):
- Mirror effect in `PostClientPage` (writes from `usePostQuery`).
- `usePostSelection.onSelectPost` (writes before nav).
- `usePostVote.onVote` (write-through optimistic vote count + rollback on error).
- `usePostVote.getPost` (re-fetches and writes).
- `useCreateComment` / `useDeleteComment` (bump/decrement `numberOfComments`).
- Reads: `PostClientPage` render, `Comments.tsx` prop, `usePostState`.

**`uiAtom.currentCommunity`** (15 consumers via `useCommunityState`):
- Mirror effects in `PostClientPage`, `CommunityClientPage`.
- Reads across 13 other files (navbar, headers, permission checks, comment hooks).

### Existing TanStack primitives (reused, not rebuilt)

- `usePostQuery` ([`lib/queries/posts/use-post.ts`](../../../lib/queries/posts/use-post.ts)) — single post by id.
- `usePostsFeedQuery` ([`lib/queries/posts/use-posts-feed.ts`](../../../lib/queries/posts/use-posts-feed.ts)) — keyed by `{scope, cursor}`. **Replaced** by new infinite primitive (see §Architecture).
- `usePostVoteMutation` ([`lib/queries/posts/use-post-vote.ts`](../../../lib/queries/posts/use-post-vote.ts)) — already invalidates `posts.detail`, `posts.votes`, and `posts.feed`.
- `useDeletePostMutation` ([`lib/queries/posts/use-delete-post.ts`](../../../lib/queries/posts/use-delete-post.ts)) — invalidates `posts.detail` and `posts.feed`.
- `useCommunityDataQuery` ([`lib/queries/community/use-community-data.ts`](../../../lib/queries/community/use-community-data.ts)) — community by id.
- `useCommunityPostVotesQuery` ([`lib/queries/posts/use-post-votes.ts`](../../../lib/queries/posts/use-post-votes.ts)) — already TanStack-backed; `usePostVoteSync` writes through `setQueryData`. Good template.

## Architecture

Five sequenced phases, each independently shippable and lint-green.

### Phase 1 — Optimistic mutations (vote, delete)

`usePostVoteMutation` and `useDeletePostMutation` gain `onMutate` / `onError` / `onSettled` handlers that own the optimistic flow currently scattered across `usePostVote.onVote`. Pattern:

```ts
onMutate: async (vars) => {
  await Promise.all([
    qc.cancelQueries({ queryKey: keys.posts.detail(vars.post.id!) }),
    qc.cancelQueries({ queryKey: keys.posts.votes(vars.communityId) }),
    qc.cancelQueries({ predicate: feedMatcher }),
  ]);
  const prev = {
    detail: qc.getQueryData<Post>(keys.posts.detail(vars.post.id!)),
    votes:  qc.getQueryData<PostVote[]>(keys.posts.votes(vars.communityId)) ?? [],
    feeds:  qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedMatcher }),
  };
  // Apply optimistic delta to detail + votes + every feed page that contains post.id
  applyOptimisticVote(qc, vars);
  return prev;
},
onError: (_err, vars, ctx) => {
  if (!ctx) return;
  qc.setQueryData(keys.posts.detail(vars.post.id!), ctx.detail);
  qc.setQueryData(keys.posts.votes(vars.communityId), ctx.votes);
  ctx.feeds.forEach(([key, data]) => qc.setQueryData(key, data));
},
onSettled: (...) => {
  // Existing invalidations stay — server truth wins on reconciliation.
}
```

Vote-delta computation (`computeVoteDelta`) and feed-page mapping (`mapFeedPost`) move from `usePostVote.tsx` into co-located helpers under `lib/queries/posts/` so the mutation owns the full optimistic pipeline. The `usePostVote` shell shrinks to permission gating + toast + `mutation.mutate(...)`.

`useDeletePostMutation` follows the same shape with a simpler context: snapshot `posts.detail` + every feed page; on mutate, drop the row from feed pages and null the detail; on error, restore.

### Phase 2 — `usePostsInfiniteQuery`

New primitive `lib/queries/posts/use-posts-infinite.ts`:

```ts
type FeedPage = { posts: Post[]; newLastVisible: PostCursor };

export function usePostsInfiniteQuery({ scope, enabled = true }: {
  scope: PostsFeedScope;
  enabled?: boolean;
}) {
  return useInfiniteQuery<FeedPage>({
    queryKey: keys.posts.infiniteFeed(scope),
    initialPageParam: null as PostCursor,
    queryFn: ({ pageParam }) =>
      getPostsAction(scope.communityId, scope.communityIds, scope.isGenericHome, pageParam),
    getNextPageParam: (last) => last.newLastVisible ?? undefined,
    enabled,
    staleTime: 0,
  });
}
```

**Key factory change.** Existing `keys.posts.feed({scope, cursor})` encodes the cursor in the key (each page is a distinct cache entry — incompatible with `useInfiniteQuery`'s single-key-with-pages model). New factory:

```ts
posts: {
  ...
  infiniteFeed: (scope: FeedScope) => ["posts", "feed", scope] as const,
}
```

The existing `keys.posts.feed` factory is **deleted** in the same commit. Mutation invalidation predicates (`q.queryKey[0] === "posts" && q.queryKey[1] === "feed"`) continue to match the new key shape unchanged. The interim `usePostsFeedQuery` consumer (`usePostsFeed`) is the only caller of the old factory and is also deleted in this commit.

**Consumer shape:**

```tsx
const feedQuery = usePostsInfiniteQuery({
  scope: { communityIds: user && communityIds.length ? communityIds : undefined,
           isGenericHome: !user || communityIds.length === 0 },
  enabled: snippetFetched || (!user && !loadingUser),
});
const posts = useMemo(
  () => feedQuery.data?.pages.flatMap((p) => p.posts) ?? [],
  [feedQuery.data],
);
```

Load-more button: `<Button onClick={() => feedQuery.fetchNextPage()} loading={feedQuery.isFetchingNextPage} disabled={!feedQuery.hasNextPage}>`.

Eliminates four `useEffect`s: two `fetchPosts` triggers in `HomePageClient` ([:44-54](../../../app/HomePageClient.tsx#L44-L54)), one in `Posts.tsx` ([:33-35](../../../components/posts/Posts.tsx#L33-L35)), and the internal scope-reset effect in `usePostsFeed` ([:84-89](../../../hooks/posts/usePostsFeed.ts#L84-L89)). Also eliminates the `getPostVotes` effect in `HomePageClient` ([:56-64](../../../app/HomePageClient.tsx#L56-L64)) — `usePostVoteSync` already returns the votes via `useCommunityPostVotesQuery`; the `getPostVotes` cache-population path is redundant once the local `posts` mirror is gone.

`hooks/posts/usePostsFeed.ts` is deleted.

### Phase 3 — `usePostVote` / `usePostDeletion` shell trim

Public surface changes:

```ts
// Before
const { onVote, getPostVotes, isVotePending } = usePostVote({ posts, setPosts, postVotes, setPostVotes });
const { onDeletePost } = usePostDeletion({ posts, setPosts });

// After
const { onVote, isVotePending } = usePostVote();
const { onDeletePost } = usePostDeletion();
```

`getPostVotes` is deleted (no caller after feed migration). `pendingPostIds: Set<string>` local state is replaced by `useMutationState` reading the live `voteMutation.variables.post.id`. Three call sites updated: `HomePageClient`, `Posts`, `PostClientPage`.

`usePostVoteSync` keeps its current shape — read-side only, sources `postVotes` from `useCommunityPostVotesQuery`. The `setPostVotes` it exposes becomes dead code on the call-site side (votes now write through the mutation's `onMutate` directly to `keys.posts.votes(communityId)`); the export is removed from the hook's return value in this phase.

### Phase 4 — Delete `uiAtom.selectedPost`

Per-site replacement:

| Site | Replacement |
|---|---|
| `PostClientPage` mirror effect ([:64-70](../../../app/community/%5BcommunityId%5D/comments/%5Bpid%5D/PostClientPage.tsx#L64-L70)) | Delete effect. Read `postData` directly from `usePostQuery`. Pass `postData ?? null` to `PostItem` and `Comments`. |
| `usePostSelection.onSelectPost` | `queryClient.setQueryData(keys.posts.detail(post.id!), post)` — prefetches the feed row into the detail cache so the routed page paints from cache on mount. |
| `usePostVote.onVote` write-through | Already gone after Phase 1 (optimistic lives in mutation `onMutate`). |
| `usePostVote.getPost` | Deleted with the rest of `usePostVote`'s old API in Phase 3. |
| `useCreateComment` count bump | `qc.setQueryData(keys.posts.detail(postId), (old) => old && { ...old, numberOfComments: old.numberOfComments + 1 })`. |
| `useDeleteComment` count decrement | Same pattern, `-1` with `Math.max(0, ...)`. |
| `usePostState.ts` | **File deleted.** Grep confirms no callers outside `usePostState` itself in active code. |
| `Icons.tsx` and other navbar readers | Verified during plan-writing — grep showed it touches `useCommunityState`, not `selectedPost`. |

`uiAtom` after this phase:

```ts
interface UiState {
  currentCommunity: Community | null;   // removed in Phase 5
  directoryMenu: DirectoryMenuState;
  savedPostsModalOpen: boolean;
}
```

### Phase 5 — Delete `uiAtom.currentCommunity` + introduce `useActiveCommunity`

New hook `hooks/community/useActiveCommunity.ts`:

```ts
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

Works in any client component nested under `app/community/[communityId]/...`. Non-community routes return `{ communityId: undefined, community: undefined }`.

**Migration matrix** (15 consumers):

| Site | Currently uses | Replacement |
|---|---|---|
| `PostClientPage` | `useCommunityState` + mirror effect | `useCommunityDataQuery({ communityId })` directly (id is in props). Delete mirror effect. |
| `HomePageClient` | `mySnippets`, `snippetFetched` only | Keep trimmed `useCommunityState` (snippets-only). No `currentCommunity` read. |
| `Comments.tsx` | `currentCommunity` for permission check | `useCommunityDataQuery({ communityId })` — id is already a prop. |
| `useCreateComment` | `currentCommunity` + `mySnippets` for permission check | `useCommunityDataQuery({ communityId: selectedPost.communityId })` + `useCommunitySnippetsQuery()` direct. |
| `usePostVote` | `currentCommunity` as "already loaded?" optimization | Drop optimization. `queryClient.fetchQuery(keys.community.detail(communityId))` dedupes & caches. |
| `Icons.tsx` (navbar) | active community context | `useActiveCommunity()`. |
| `SubmitPostClientPage` | active community | `useCommunityDataQuery` (id in route/props). |
| `CommunityClientPage` | mirror effect + reads | Same pattern as `PostClientPage` — drop mirror, read query. |
| `CreatePostLink` | active community | `useActiveCommunity()`. |
| `useCommunityPermissions` | takes `Community` as arg already | No signature change. |
| `CommunityHeader` | community branding | Take community as prop OR `useActiveCommunity()`. |
| `app/communities/page.tsx` | grep verify (likely `mySnippets` only) | Plan task verifies; expected: no change. |
| `Recommendations.tsx` | grep verify (likely `mySnippets` only) | Plan task verifies; expected: no change. |
| `About.tsx` | takes community as prop already | No change. |
| `usePostSelection` | grep showed no `currentCommunity` read | No change beyond Phase 4. |

`useCommunityState` after this phase is a thin read-only hook returning `{ mySnippets, snippetFetched }`. The `setCommunityStateValue` write path and the `currentCommunity` field are deleted.

`uiAtom` final shape:

```ts
interface UiState {
  directoryMenu: DirectoryMenuState;
  savedPostsModalOpen: boolean;
}
```

The atom is now genuinely client-only UI state — no server-state shadows.

## Risks and mitigations

**Risk 1 — Optimistic feed-page mapping is buggy.** A post appears in multiple cached pages (overlapping queries with different scopes). The `mapFeedPost` helper must touch every page key matching the feed predicate. Mitigation: unit tests in Phase 1 cover three scope-matrix cases (`communityId`, `communityIds`, `isGenericHome`) plus the "post in two scopes simultaneously" case.

**Risk 2 — `keys.posts.feed` deletion breaks something.** The only caller is the legacy `usePostsFeed`, also deleted in the same commit. Mitigation: grep before commit; `pnpm typecheck` is the safety net.

**Risk 3 — A `currentCommunity` consumer uses the field in a way the migration table mischaracterizes.** Mitigation: each row in Phase 5's matrix becomes a plan task with a verify step (read the file, confirm the usage, decide local replacement). If a site needs something `useActiveCommunity` doesn't provide (e.g. a community known by ID but not in route), it falls back to direct `useCommunityDataQuery(id)` — the new architecture handles this case explicitly.

**Risk 4 — Optimistic write-through races with `cancelQueries`.** Standard TanStack pattern; documented and well-trodden. The vote mutation already exercises the invalidation path; only the `onMutate` snapshot/restore is new.

**Risk 5 — `useMutationState` doesn't expose `variables` the way Phase 3 assumes.** Fallback: keep `pendingPostIds: Set<string>` in the `usePostVote` shell. Functional regression: none; cosmetic state ownership only.

## Testing strategy

- Reuse [`__tests__/helpers/renderWithProviders.tsx`](../../../__tests__/helpers/renderWithProviders.tsx) per parent spec §10.
- **Phase 1:** new specs for `usePostVoteMutation` covering: optimistic apply, error rollback, settled invalidation order, concurrent vote on different posts, vote-on-vote (toggle). Same for `useDeletePostMutation` minus the toggle case.
- **Phase 2:** new specs for `usePostsInfiniteQuery` covering: initial page, `fetchNextPage` accumulation, `getNextPageParam` exit condition, scope change → new query.
- **Phase 3:** existing `usePostVote` / `usePostDeletion` tests rewritten to assert against query cache (`qc.getQueryData(keys.posts.detail(...))`) rather than `setPosts` spies. Public surface assertion: `usePostVote()` accepts no args.
- **Phase 4:** new spec for `usePostSelection` (verifies `setQueryData` prefetch); new specs for `useCreateComment` / `useDeleteComment` count-bump via cache.
- **Phase 5:** new spec for `useActiveCommunity` (route-extraction + query enabling). Existing tests for `useCommunityState` updated to assert the trimmed snippets-only surface.

## Migration order and commits

One branch, six commits, each independently green:

1. **Phase 1.** Optimistic `onMutate`/`onError` for `usePostVoteMutation` + `useDeletePostMutation`. Public surfaces unchanged.
2. **Phase 2.** Add `usePostsInfiniteQuery` + new key factory. Migrate `HomePageClient` + `Posts.tsx`. Delete `usePostsFeed.ts` and `keys.posts.feed`. Verify mutation invalidation predicates still match.
3. **Phase 3.** Trim `usePostVote` / `usePostDeletion` to no-arg shells. Update three call sites. Drop `usePostVoteSync.setPostVotes` from return.
4. **Phase 4.** Delete `uiAtom.selectedPost`. Migrate eight consumers per matrix. Delete `usePostState.ts`.
5. **Phase 5.** Add `useActiveCommunity`. Migrate 15 consumers per matrix. Trim `useCommunityState` to snippets-only. Delete `uiAtom.currentCommunity`.
6. **Lint sweep.** Address the original 13 lint problems. Most resolve naturally (the effects causing them no longer exist). Remaining: `<img>` → `next/image` (or `unoptimized` for the data-URL preview) in `ImageCropModal`, `watch()` → `useWatch` in `CommentInput` (in-flight already from session start), unused disables anywhere they remain.

## Green gate

```
pnpm test
pnpm typecheck
pnpm eslint
pnpm build
```

All four pass with **zero new `eslint-disable` comments**. Any disable comments added during the lint-only pass earlier in session ([`HomePageClient.tsx:48,54,64`](../../../app/HomePageClient.tsx#L48), [`PostClientPage.tsx:67`](../../../app/community/%5BcommunityId%5D/comments/%5Bpid%5D/PostClientPage.tsx#L67)) are removed by the refactor — the effects they sit on no longer exist.

## What this plan does not do

(Reiterated from §Out of scope for emphasis.)

- Does not refactor `useCommunitiesFeed` to `useInfiniteQuery`. Separate backlog item.
- Does not add optimistic UI to any mutation other than vote and delete-post.
- Does not change any server action, route handler, schema, or auth flow.
- Does not introduce or remove dependencies. `useInfiniteQuery` and `useMutationState` are already part of TanStack Query v5 in use.
