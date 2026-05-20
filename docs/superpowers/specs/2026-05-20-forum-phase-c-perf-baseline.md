# Phase C — Perf Baseline

**Status:** baseline pending measurements (C1) / re-measure (C4)
**Methodology:** see Phase C spec §9.

## Tooling
- Chrome DevTools → Performance tab → 4× CPU throttle, fast 3G, 5s capture
- React DevTools → Profiler → record load + interact
- Optional: Lighthouse one-off per route (LCP, TBT)

## Suspected hot spots (from code reading, before measurement)

These are the hypotheses C1 confirms or rules out. Each entry: where the suspicion comes from, what to look for in the trace, what's expected to improve.

### H1 — Wide Jotai atom widening on feed paging
- **Source:** `hooks/posts/usePostsFeed.ts` calls `setPostStateValue((prev) => ({ ...prev, posts: [...prev.posts, ...new] }))` on every `fetchPosts`. Atom subscribers include any component reading `posts`, `postVotes`, or `selectedPost`.
- **Look for:** in React Profiler, every "Load more" should cause re-renders in components that don't read the new posts (e.g. comment counts, vote indicators).
- **Expected after C2/C3:** narrowed re-render — only the feed list itself re-renders.

### H2 — Cold remount fetches on route change
- **Source:** `hooks/community/useCommunitiesFeed.ts` has `useEffect(() => { fetchCommunities(true); }, [])` — re-fetches every mount. Back-nav across community pages re-fetches with no cache.
- **Look for:** Performance tab → Network — repeated GET-equivalent server-action requests on every navigation between communities.
- **Expected after C2:** cached data on back-nav within `gcTime` (5 min).

### H3 — Duplicate sibling-hook fetches against the same id
- **Source:** community page may mount `useCommunityData` + `useCommunitySnippets` + `useCommunityMembers` all keyed on the same `communityId`. No dedup; each runs its own action.
- **Look for:** in a single load, multiple action calls for the same community.
- **Expected after C2:** TanStack dedupes by queryKey within one tick; sibling hooks hit the cache.

### H4 — useEffect-driven cascades on initial mount
- **Source:** `useCommentList`, `usePostVoteSync`, `useCommunitySnippets` — each sets state in effect, which triggers another render before data arrives.
- **Look for:** in Profiler, two-step render → commit → render cycles per route on cold load.
- **Expected after C2:** single-render commit when data is hydrated; with `<HydrationBoundary>` no client fetch on first paint.

### H5 — Heavy Chakra component trees
- **Source:** layout/Navbar/PostItem all wrap many Chakra primitives. This is Phase D's domain — recorded here for completeness.
- **Look for:** wide flamegraph rows under Chakra primitives.
- **Expected:** **not improved by Phase C** — note for Phase D backlog.

## Routes

For each route, capture:
- LCP (ms)
- Total render count during the 5s window (React Profiler)
- Top 5 components by render time (flamegraph)
- Network: count of server-action calls during the 5s window
- Notes: hypothesis confirmed/refuted

### Route: `/` (home)

#### Baseline (C1)
- LCP: _TBD_ ms
- Render count: _TBD_
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Confirmed hypotheses: _TBD_
- Ruled out: _TBD_

#### After Phase C (C4)
- LCP: _TBD_ ms (Δ _TBD_)
- Render count: _TBD_ (Δ _TBD_)
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Hot spots resolved: _TBD_
- Hot spots remaining: _TBD_

### Route: `/community/[id]` (community page)

#### Baseline (C1)
- LCP: _TBD_ ms
- Render count: _TBD_
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Confirmed hypotheses: _TBD_
- Ruled out: _TBD_

#### After Phase C (C4)
- LCP: _TBD_ ms (Δ _TBD_)
- Render count: _TBD_ (Δ _TBD_)
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Hot spots resolved: _TBD_
- Hot spots remaining: _TBD_

### Route: `/community/[id]/comments/[pid]` (post detail)

#### Baseline (C1)
- LCP: _TBD_ ms
- Render count: _TBD_
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Confirmed hypotheses: _TBD_
- Ruled out: _TBD_

#### After Phase C (C4)
- LCP: _TBD_ ms (Δ _TBD_)
- Render count: _TBD_ (Δ _TBD_)
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Hot spots resolved: _TBD_
- Hot spots remaining: _TBD_

### Route: `/community/[id]/submit` (submit page)

#### Baseline (C1)
- LCP: _TBD_ ms
- Render count: _TBD_
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Confirmed hypotheses: _TBD_
- Ruled out: _TBD_

#### After Phase C (C4)
- LCP: _TBD_ ms (Δ _TBD_)
- Render count: _TBD_ (Δ _TBD_)
- Top 5 components: _TBD_
- Server-action calls: _TBD_
- Hot spots resolved: _TBD_
- Hot spots remaining: _TBD_

## C1 sign-off

- [ ] All four routes measured
- [ ] Each hypothesis confirmed/refuted/deferred
- [ ] Findings recorded above
- [ ] User has reviewed and signed off → ready for C2 plan
