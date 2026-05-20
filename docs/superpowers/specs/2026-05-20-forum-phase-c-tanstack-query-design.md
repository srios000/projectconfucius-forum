# Phase C — State → TanStack Query (design)

**Status:** Spec
**Date:** 2026-05-20
**Predecessors:** Phase A (Postgres + sibling auth, merged), Phase B (R2 image storage, merged)
**Successor:** Phase D (Chakra → shadcn re-skin)

## 1. Goal

> **No manual fetch-in-effect; mutations invalidate cache.** Server state lives
> in TanStack Query; Jotai retained for UI/modal/client state only.

Concretely: ~30 custom hooks under `hooks/{admin,comments,community,posts}` and
`hooks/` migrate to TanStack Query primitives under `lib/queries/`. The four
Jotai atoms collapse to one (`atoms/uiAtom.ts`) holding only UI state
(`directoryMenu`, `selectedPost`). The 6 `// TanStack Query migration tracked
separately` lint suppressions disappear.

## 2. Why now

User reports the forum feels slow on Windows / Chrome. Code review of the
current state surface points to several likely root causes that the migration
naturally fixes:

- `postStateAtom` is a wide atom holding `posts: Post[]`, `postVotes: PostVote[]`,
  and `selectedPost`. Every page-append widens the atom; every subscriber
  re-renders. Splitting server state out of Jotai narrows the re-render surface.
- Sibling hooks against the same id (`useCommunityData` + `useCommunitySnippets`
  + `useCommunityMembers` all keyed on `communityId`) currently make duplicate
  fetches with no dedup. TanStack Query dedupes by key inside one tick.
- Feed effects reset state on route change and re-fetch cold every time. A
  per-key cache with sensible `staleTime` gives free back-nav warmth.
- 6 hooks carry `// eslint-disable-next-line react-hooks/set-state-in-effect`
  suppressions explicitly flagged for this migration.

We don't assume these are *the* cause. Phase C opens with a profiling baseline
(C1) that records actual numbers before we change code, and re-measures at the
end (C4).

## 3. Approach (chosen)

**Hybrid:** `lib/queries/*` holds queryKey factory, queryFn definitions, and
primitive `useXxxQuery` / `useXxxMutation` hooks. Existing hooks under
`hooks/*` become thin shells that delegate to those primitives, preserving
their public call signature so consumers don't change in C2/C3. Shells either
retire in C4 cleanup or stay as documented convenience wrappers.

Rejected:
- **Thin wrappers only** — leaves a "manual" return surface (e.g.
  `fetchPosts(initial)`) and no idiomatic TanStack code path for future work.
- **Greenfield + rewrite consumers** — every call site touched, much bigger
  diff and review burden; harder to land incrementally.

## 4. Architecture

### 4.1 Folder layout

```
lib/queries/
  client.ts                # makeQueryClient(); server: per-request, client: singleton
  provider.tsx             # <QueryProvider> — QueryClientProvider + Devtools (dev only)
  keys.ts                  # queryKey factory (see §4.3)
  posts/
    use-posts-feed.ts
    use-post.ts
    use-post-vote.ts
    use-create-post.ts
    use-delete-post.ts
    use-saved-posts.ts
  community/
    use-communities.ts
    use-community-data.ts
    use-community-snippets.ts
    use-community-members.ts
    use-community-admins.ts
    use-community-mutations.ts   # create / delete / join / leave / privacy / remove-member
    use-community-image.ts       # image upload mutation
  comments/
    use-comments.ts
    use-comment-mutations.ts     # create / delete
  admin/
    use-admin-list.ts
    use-admin-search.ts
    use-admin-mutations.ts       # add / remove
  search/
    use-search.ts
  profile/
    use-user-profile.ts           # query + image-upload mutation

hooks/                            # legacy shells — SAME file paths as today,
  posts/usePostsFeed.ts           # rewritten internally to delegate to
  ... (~30 files)                 # lib/queries/*. Public signatures preserved
                                  # so call sites in components don't change.

atoms/
  uiAtom.ts                       # NEW — { directoryMenu, selectedPost }
  (deleted: postsAtom.ts, communitiesAtom.ts, savedPostsAtom.ts, directoryMenuAtom.ts)
```

### 4.2 Provider wiring

`app/providers.tsx` adds `<QueryProvider>` between `<JotaiProvider>` and
`<ChakraProvider>`. `QueryProvider` mounts a `QueryClient` (singleton on the
client; fresh per render on the server), and conditionally mounts
`<ReactQueryDevtools initialIsOpen={false} />` in `process.env.NODE_ENV !==
'production'`.

### 4.3 queryKey factory (`lib/queries/keys.ts`)

```ts
export const keys = {
  posts: {
    all: ['posts'] as const,
    feed: (a: FeedArgs) => ['posts', 'feed', a] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    votes: (userId: string) => ['posts', 'votes', userId] as const,
    saved: (userId: string) => ['posts', 'saved', userId] as const,
  },
  community: {
    all: ['community'] as const,
    list: (limit: number) => ['community', 'list', limit] as const,
    detail: (id: string) => ['community', 'detail', id] as const,
    snippets: (userId: string) => ['community', 'snippets', userId] as const,
    members: (id: string) => ['community', 'members', id] as const,
    admins: (id: string) => ['community', 'admins', id] as const,
  },
  comments: {
    forPost: (postId: string) => ['comments', postId] as const,
  },
  admin: {
    search: (q: string) => ['admin', 'search', q] as const,
  },
  search: (q: string) => ['search', q] as const,
  profile: (userId: string) => ['profile', userId] as const,
} as const;
```

All invalidation goes through this factory. No ad-hoc string keys in hook code.

### 4.4 queryFn = server action

Reads continue to call `app/actions/reads.ts` server actions
(`getPostsAction`, `getCommunityDataAction`, etc.). Mutations call action
handlers under `app/actions/{posts,community,comments,admin,profile}.ts`. No
new HTTP layer is introduced.

### 4.5 SSR hydration

Server components that own a first-fetch responsibility call
`queryClient.prefetchQuery(...)` and wrap their tree in
`<HydrationBoundary state={dehydrate(queryClient)}>`. Targets:

- `app/page.tsx` — generic / personalized home feed
- `app/community/[communityId]/comments/CommunityClientPage.tsx` parent
- `app/community/[communityId]/comments/[pid]/PostClientPage.tsx` parent
- `app/community/[communityId]/submit/SubmitPostClientPage.tsx` parent

Client hooks pick up the hydrated cache without a re-fetch on first paint.

## 5. Cache configuration

QueryClient defaults:

```ts
defaultOptions: {
  queries: {
    staleTime: 30_000,           // 30s — feeds re-validate on remount after 30s
    gcTime: 5 * 60_000,          // 5min — kept in memory after unmount for back-nav warmth
    refetchOnWindowFocus: false, // forum-style traffic doesn't need it
    retry: 1,
  },
}
```

Per-key overrides:

| Key | staleTime | Reason |
|---|---|---|
| `keys.posts.feed(...)` | `0` | feeds want freshness on every remount |
| `keys.community.detail(id)` | `60_000` | community metadata changes rarely |
| `keys.admin.list(id)` | `0` | security-relevant; always re-validate |
| `keys.posts.detail(id)` | `30_000` (default) | balance freshness vs back-nav |
| `keys.search(q)` | `60_000` | search-as-you-type benefits from cache |

## 6. Mutation → invalidation map (contract enforced in C3)

| Mutation | Invalidates |
|---|---|
| `usePostVote` | `keys.posts.detail(postId)`, `keys.posts.feed.*` (predicate), `keys.posts.votes(userId)` |
| `useCreatePost` | `keys.posts.feed.*` |
| `useDeletePost` | `keys.posts.feed.*`, `keys.posts.detail(postId)` |
| `useCreateComment` | `keys.comments.forPost(postId)`, `keys.posts.detail(postId)` |
| `useDeleteComment` | `keys.comments.forPost(postId)`, `keys.posts.detail(postId)` |
| `useJoinCommunity` / `useLeaveCommunity` | `keys.community.snippets(userId)`, `keys.community.detail(id)`, `keys.community.members(id)` |
| `useCreateCommunity` | `keys.community.list.*`, `keys.community.snippets(userId)` |
| `useDeleteCommunity` | `keys.community.list.*`, `keys.community.detail(id)`, `keys.community.snippets(userId)` |
| `useCommunityPrivacy` | `keys.community.detail(id)` |
| `useRemoveCommunityMember` | `keys.community.members(id)`, `keys.community.snippets(removedUserId)` |
| `useAddAdmin` / `useRemoveAdmin` | `keys.community.admins(id)` |
| `useSavedPosts.toggle` | `keys.posts.saved(userId)` |
| `useCommunityImage.upload` | `keys.community.detail(id)` |
| `useUserProfile.uploadImage` | `keys.profile(userId)` |

"`predicate`" means using `queryClient.invalidateQueries({ predicate: (q) =>
q.queryKey[0] === 'posts' && q.queryKey[1] === 'feed' })` to catch every
parametrized feed key.

## 7. Jotai decomposition

| Atom (current) | Action |
|---|---|
| `postStateAtom` | decompose: keep `selectedPost`, move into `uiAtom.ts`; drop `posts`, `postVotes` |
| `communitiesAtom` | delete (server state → `keys.community.*`) |
| `savedPostsAtom` | delete (server state → `keys.posts.saved`) |
| `directoryMenuAtom` | move into `uiAtom.ts` |

Final `atoms/` directory contains exactly one file (`uiAtom.ts`). Any
component that previously read server state from a Jotai atom now reads it
from the corresponding TanStack hook.

## 8. Sub-phase plan

### C1 — Foundation + perf baseline (~1 day, 1 PR)
- Install `@tanstack/react-query`, `@tanstack/react-query-devtools`
- Add `lib/queries/{client,provider,keys}.ts`
- Wire `<QueryProvider>` into `app/providers.tsx`
- **Perf diagnosis pass** — capture baseline for four routes (home, community,
  post detail, submit). Output: `docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md`
  with measured LCP, render counts, top-5 flamegraph entries per route,
  confirmed hot spots, ruled-out hypotheses.
- Green gate: app boots, devtools work, baseline doc filed.

### C2 — Reads (~2 days, 1 PR)
- Migrate every read hook to `lib/queries/*`; legacy shells delegate
- Add `HydrationBoundary` on the four SSR pages
- Delete `communitiesAtom`, `savedPostsAtom`, and the server-state fields of
  `postStateAtom`
- Green gate: all 6 `set-state-in-effect` TanStack-tagged suppressions removed;
  zero fetch-in-effect patterns remain in migrated hooks; existing tests still
  pass; new tests cover at least one query per group.

### C3 — Mutations + invalidation (~1.5 days, 1 PR)
- Every mutation from §6 implemented as `useMutation` with the listed
  invalidation
- Green gate: vote/join/create/delete flows refresh the correct lists without
  any manual refetch calls in component code; mutation tests assert correct
  invalidation.

### C4 — Cleanup + handoff (~0.5 day, 1 PR)
- Decide per-hook whether legacy shells stay or are inlined at call sites
- Collapse `atoms/` to a single `uiAtom.ts`
- Remove all leftover lint suppressions enabled by the migration
- Re-measure perf baseline; update the baseline doc with after-numbers and
  delta per hot spot
- Green gate: `pnpm test && pnpm typecheck && pnpm lint && pnpm build` clean;
  baseline doc shows targeted hot spots improved with measured numbers.

## 9. Perf diagnosis methodology (used in C1, replayed in C4)

**Routes to profile:**
- `/` (home — generic and personalized)
- `/community/[id]` (community page)
- `/community/[id]/comments/[pid]` (post detail)
- `/community/[id]/submit` (submit page)

**Tooling:**
- `pnpm dev` + Chrome DevTools **Performance** tab — 4× CPU throttle, fast 3G,
  5s capture covering "load + interact"
- React DevTools **Profiler** — record load + interact, read flamegraph
- Optional Lighthouse one-off per route for LCP/TBT baseline

**Hypotheses to confirm/refute:**
1. `postStateAtom` widening → broad re-renders on every feed-page append
2. `useCommunitiesFeed` cold-fetches on every route change (no cache warmth)
3. Duplicate fetches across sibling hooks against the same id
4. `useEffect`-driven state cascades on initial mount
5. Heavy Chakra component trees (note for Phase D — out of scope here)

**Output:** baseline doc per route — measured numbers, confirmed hot spots,
ruled-out hypotheses. Same doc is updated post-C4 with after-numbers and
deltas. Hot spots that don't show improvement become Phase D candidates.

**Caveat:** Profiling needs a human in the browser. Phase C's executor (the
assistant) cannot capture traces; it will guide methodology, identify
suspected hot spots from code reading, and help interpret what the user
records.

## 10. Testing strategy

- `__tests__/helpers/renderWithProviders.tsx` — wraps a `QueryClientProvider`
  with a fresh `QueryClient` per test (`retry: false, gcTime: 0`); also wraps
  Jotai and Chakra providers used by component tests
- Query tests: mount via the helper, assert data shape from `useXxxQuery`
- Mutation tests: trigger mutation, assert co-rendered query sees fresh data
  (proves invalidation happened); spy on `invalidateQueries` only when the
  co-rendered approach is awkward
- Server-action tests (existing) unchanged
- HydrationBoundary integration: smoke test renders an SSR page + reads
  pre-hydrated data without a network mock firing

## 11. Green gate (end of C4)

All of:
- `pnpm test` — vitest green; mutation invalidation tests included
- `pnpm typecheck` clean
- `pnpm lint` clean; **zero** `// eslint-disable-next-line
  react-hooks/set-state-in-effect -- ... TanStack Query migration tracked
  separately` comments remain
- `pnpm build` clean
- App boots; four profiled routes render
- Perf baseline doc updated with C4 measurements showing improvement on the
  hot spots identified in C1

## 12. Out of scope (in `docs/superpowers/backlog.md`)

- **Chakra → shadcn re-skin** — Phase D, already on roadmap
- **Optimistic UI** for vote/join mutations — post-Phase-C polish
- **`useInfiniteQuery`** refactor of feed hooks — post-Phase-C refactor; this
  spec preserves the current `fetchPosts(initial)` API by accumulating pages
  in component-local `useState`

## 13. Known limitations

- Without `useInfiniteQuery`, feed hooks keep an external "accumulated pages"
  state alongside TanStack's per-cursor cache. This is a known concession in
  favour of preserving the public hook shape; addressed by the deferred
  backlog item.
- The perf-baseline pass depends on the user actually running DevTools.
  Without measurements, C4's "improved hot spots" green-gate check degrades
  to "no observed regressions" + code-level evidence that the named root
  causes (atom widening, duplicate sibling fetches, cold remount fetches)
  no longer apply.

## 14. Non-goals

- No data migration (state is in-memory; cache rebuilds on cold start)
- No new server actions or HTTP layer
- No auth/authorization changes (Phase A already settled this)
- No UI redesign (Phase D)
- No optimistic updates, no infinite-query refactor (§12)
