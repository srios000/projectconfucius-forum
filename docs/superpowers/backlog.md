# Backlog

Deferred work items that are explicitly out of scope of their originating
spec but worth doing later. Each entry: what, why deferred, originating spec.

See [`roadmap.md`](roadmap.md) for phase status.

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
  on `/c/[id]` (post-D path), community settings page for upload/replace,
  community card on discovery. Storage via existing Phase B R2 plumbing
  (presign + confirm + cleanup); new key shape under
  `community/{id}/cover-{ts}.jpg`. Schema change adds
  `imageURLBanner` (or similar) to `community` table.
- **Why deferred:** new feature, not part of the migration roadmap. Owns
  its own spec → plan → green gate. Sequencing-wise, easiest after Phase D
  lands so the new community header (jade gradient banner with the
  community-quote treatment) can incorporate the banner from day one.
- **From:** ad-hoc 2026-05-20

## Real-time vote / comment updates
- **What:** push-style live updates for post vote counts, comment counts,
  and new comments arriving on a post the user is viewing. Either via
  Postgres `LISTEN`/`NOTIFY` bridged through a Next.js route handler with
  SSE, or via websockets (likely the former — keeps stack simple).
- **Why deferred:** Phase D is the right time to design the visual treatment
  for "live" indicators (subtle jade pulse on the vote count when remote
  votes arrive, "+ N new comments" sticky banner). Implementation is its
  own spec because it touches the data layer and infrastructure.
- **From:** [Phase D spec §9](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)

## Notifications / inbox
- **What:** persistent in-app inbox for replies to your posts/comments,
  community moderator actions, and direct mentions. Includes notification
  storage table, read/unread state, navbar bell with unread count, dedicated
  `/inbox` page.
- **Why deferred:** new feature. Phase D doesn't surface it.
- **From:** [Phase D spec §9](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)

## Federation / ActivityPub
- **What:** publish posts and comments as ActivityPub objects; federate with
  Lemmy / Mastodon / other forum federations. Receive inbound activities.
- **Why deferred:** large surface, separate concern from the house stack
  migration. Worth scoping standalone after the migration settles.
- **From:** [Phase D spec §9](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)

## Markdown-rendering polish
- **What:** rich Markdown rendering for post bodies and comments — code
  blocks with syntax highlighting, embedded image rendering, link
  previews, footnotes, math. Current implementation is intentionally
  minimal (plain text with line breaks).
- **Why deferred:** content-layer polish, not a Phase D goal. The composer
  already accepts Markdown input; only the renderer is minimal.
- **From:** [Phase D spec §9](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)

## Formal accessibility (WCAG) audit
- **What:** end-to-end accessibility pass against WCAG 2.2 AA. Keyboard
  navigation, screen reader, contrast, focus management, ARIA. Phase D
  ships shadcn/Radix primitives which provide a strong baseline, but a
  formal audit catches the gaps that compound layouts introduce.
- **Why deferred:** own discipline; benefits from the migration being
  complete so the audit covers stable surfaces.
- **From:** [Phase D spec §8.3](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)
