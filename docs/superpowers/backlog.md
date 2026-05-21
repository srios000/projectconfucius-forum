# Backlog

Deferred work items that are explicitly out of scope of their originating
spec but worth doing later. Each entry: what, why deferred, originating spec.

## Phase D — Chakra → shadcn re-skin
- **What:** faithful re-skin of ~90 components from Chakra UI v3 to shadcn +
  Tailwind; remove `@chakra-ui/*`, `@emotion/*`, and any unused
  `framer-motion` usage.
- **Why deferred:** terminal phase of the migration roadmap; visual change
  is high-risk and shouldn't be combined with state-management changes.
- **From:** [Phase A spec §8](specs/2026-05-19-forum-phase-a-postgres-sibling-auth-design.md),
  [Phase C spec §12](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)

## Optimistic UI for join / save mutations
- **What:** add optimistic UI to `useJoinCommunity`, `useLeaveCommunity`,
  `useSavePostMutation`, and `useUnsavePostMutation` so the UI updates
  immediately rather than waiting for the server round-trip. Vote
  optimistic UI shipped 2026-05-21 (rollback on error + per-post pending
  state in `hooks/posts/usePostVote.tsx`) — same pattern applies to these
  remaining mutations.
- **Why deferred:** the vote case was the primary perceived-lag source.
  Save/join are less frequent and can ship as small follow-ups.
- **From:** [Phase C spec §12](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)

## Feed/votes staleTime + drop redundant vote-mutation invalidations
- **What:** with vote optimistic UI in place, the `usePostVoteMutation`
  `onSuccess` no longer needs to invalidate `posts.feed.*` /
  `posts.detail` / `posts.votes` — the visible state is already correct
  from the optimistic write. Drop those invalidations to stop the 3-way
  refetch on every vote. Separately, raise `staleTime` on
  `usePostsFeedQuery` (currently `0`) to ~30s so mount/focus doesn't
  re-fetch the whole feed.
- **Why deferred:** small polish; tracked as follow-up after the optimistic
  vote landing to confirm the cache is genuinely correct without
  invalidation.
- **From:** ad-hoc 2026-05-21 perf pass

## `useInfiniteQuery` migration of feed hooks
- **What:** convert `usePostsFeed` and `useCommunitiesFeed` from
  manual-cursor + component-local accumulation to TanStack
  `useInfiniteQuery`. Public hook shape may change (`fetchPosts(initial)` →
  `fetchNextPage`).
- **Why deferred:** Phase C preserved the current hook API to keep the
  consumer diff minimal; `useInfiniteQuery` would touch every call site.
- **From:** [Phase C spec §12](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)

## Community cover image (banner)
- **What:** add a wide rectangular cover/banner image to communities,
  alongside the existing circular logo. Likely surfaces: community header
  on `/community/[id]`, community settings modal for upload/replace,
  community card on discovery. Storage via existing Phase B R2 plumbing
  (presign + confirm + cleanup); new key shape under
  `community/{id}/cover-{ts}.jpg`. Schema change adds
  `imageURLBanner` (or similar) to `community` table.
- **Why deferred:** new feature, not part of the migration roadmap. Owns
  its own spec → plan → green gate. Sequencing-wise, easiest after Phase C
  lands so mutations slot cleanly into the new TanStack invalidation map
  (`keys.community.detail(id)`).
- **From:** ad-hoc 2026-05-20
