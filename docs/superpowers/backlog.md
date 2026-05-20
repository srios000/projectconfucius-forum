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

## Optimistic UI for vote / join mutations
- **What:** add `onMutate` / `onError` rollback to `usePostVote`,
  `useJoinCommunity`, `useLeaveCommunity` so the UI updates immediately
  rather than waiting for the server round-trip.
- **Why deferred:** Phase C scope was kept mechanical; optimistic updates
  introduce rollback complexity (toast on failure, conflict resolution with
  server's authoritative state) that's better tackled once the cache
  surfaces are stable.
- **From:** [Phase C spec §12](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)

## `useInfiniteQuery` migration of feed hooks
- **What:** convert `usePostsFeed` and `useCommunitiesFeed` from
  manual-cursor + component-local accumulation to TanStack
  `useInfiniteQuery`. Public hook shape may change (`fetchPosts(initial)` →
  `fetchNextPage`).
- **Why deferred:** Phase C preserved the current hook API to keep the
  consumer diff minimal; `useInfiniteQuery` would touch every call site.
- **From:** [Phase C spec §12](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)
