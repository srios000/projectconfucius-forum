# Phase C1 — Foundation + Perf Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install TanStack Query, mount its provider, lay down the `lib/queries/` foundation (queryKey factory + QueryClient factory + provider), and capture a perf baseline for the four target routes so C2/C3 plans can target real hot spots.

**Architecture:** App-Router-friendly QueryClient (per-request on server, singleton on client). Provider mounted inside `app/providers.tsx` between Jotai and Chakra. queryKey factory is the single source of truth for all keys — no ad-hoc strings anywhere. ReactQueryDevtools mount gated on `NODE_ENV !== 'production'`.

**Tech Stack:** `@tanstack/react-query@^5`, `@tanstack/react-query-devtools@^5`, Next 16 App Router, React 19, Vitest + happy-dom, pnpm.

**Spec reference:** [docs/superpowers/specs/2026-05-20-forum-phase-c-tanstack-query-design.md](../specs/2026-05-20-forum-phase-c-tanstack-query-design.md) §4, §5, §8 (C1), §9.

---

## File Structure

**New files:**
- `lib/queries/client.ts` — `getQueryClient()` factory (server: per-request; client: singleton)
- `lib/queries/keys.ts` — queryKey factory (`keys.posts.*`, `keys.community.*`, etc.)
- `lib/queries/provider.tsx` — `<QueryProvider>` client component (mounts `QueryClientProvider` + dev-only Devtools)
- `__tests__/lib/queries/keys.test.ts` — sanity tests for key shape and immutability
- `docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md` — baseline document; sections per route get filled with measurements during this phase and re-measured in C4

**Modified files:**
- `package.json` — add two deps under `dependencies`
- `app/providers.tsx` — wrap with `<QueryProvider>` between `<JotaiProvider>` and `<EmotionRegistry>`

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [x] **Step 1: Install runtime dependencies**

Run from `c:/Users/sinta/projects/projectconfucius-forum`:

```bash
pnpm add @tanstack/react-query@^5 @tanstack/react-query-devtools@^5
```

Expected: both packages added to `dependencies` in `package.json` (devtools is published as a runtime dep but only imported in dev-gated code). `pnpm-lock.yaml` updates.

- [x] **Step 2: Verify install**

Run:

```bash
pnpm list @tanstack/react-query @tanstack/react-query-devtools
```

Expected: both listed with v5.x.x version.

- [x] **Step 3: Verify nothing else broke**

Run:

```bash
pnpm typecheck
```

Expected: clean exit (no new TS errors — these are pure additions).

- [x] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @tanstack/react-query for Phase C"
```

---

## Task 2: queryKey factory

**Files:**
- Create: `lib/queries/keys.ts`
- Create: `__tests__/lib/queries/keys.test.ts`

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/queries/keys.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { keys } from "@/lib/queries/keys";

describe("queryKey factory", () => {
  it("posts.feed produces stable tuple with args", () => {
    const a = keys.posts.feed({ communityId: "c1", isGenericHome: false });
    const b = keys.posts.feed({ communityId: "c1", isGenericHome: false });
    expect(a).toEqual(b);
    expect(a[0]).toBe("posts");
    expect(a[1]).toBe("feed");
  });

  it("posts.detail keyed by id", () => {
    expect(keys.posts.detail("p1")).toEqual(["posts", "detail", "p1"]);
  });

  it("community.detail keyed by id", () => {
    expect(keys.community.detail("c1")).toEqual(["community", "detail", "c1"]);
  });

  it("comments.forPost keyed by postId", () => {
    expect(keys.comments.forPost("p1")).toEqual(["comments", "p1"]);
  });

  it("posts.all is the top-level invalidation prefix", () => {
    expect(keys.posts.all).toEqual(["posts"]);
  });

  it("community.all is the top-level invalidation prefix", () => {
    expect(keys.community.all).toEqual(["community"]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- __tests__/lib/queries/keys.test.ts
```

Expected: FAIL — cannot find module `@/lib/queries/keys`.

- [x] **Step 3: Write the factory**

Create `lib/queries/keys.ts`:

```ts
export type FeedArgs = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

export const keys = {
  posts: {
    all: ["posts"] as const,
    feed: (a: FeedArgs) => ["posts", "feed", a] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
    votes: (userId: string) => ["posts", "votes", userId] as const,
    saved: (userId: string) => ["posts", "saved", userId] as const,
  },
  community: {
    all: ["community"] as const,
    list: (limit: number) => ["community", "list", limit] as const,
    detail: (id: string) => ["community", "detail", id] as const,
    snippets: (userId: string) => ["community", "snippets", userId] as const,
    members: (id: string) => ["community", "members", id] as const,
    admins: (id: string) => ["community", "admins", id] as const,
  },
  comments: {
    forPost: (postId: string) => ["comments", postId] as const,
  },
  admin: {
    search: (q: string) => ["admin", "search", q] as const,
  },
  search: (q: string) => ["search", q] as const,
  profile: (userId: string) => ["profile", userId] as const,
} as const;
```

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- __tests__/lib/queries/keys.test.ts
```

Expected: 6 tests pass.

- [x] **Step 5: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 6: Commit**

```bash
git add lib/queries/keys.ts __tests__/lib/queries/keys.test.ts
git commit -m "feat: queryKey factory for Phase C TanStack migration"
```

---

## Task 3: QueryClient factory

**Files:**
- Create: `lib/queries/client.ts`

Background: Per TanStack Query docs for Next.js App Router, the QueryClient must be **per-request on the server** (or you get cross-request data leaks) and **a singleton on the client** (to survive React re-renders). `isServer` from `@tanstack/react-query` distinguishes the two.

- [x] **Step 1: Write the factory**

Create `lib/queries/client.ts`:

```ts
import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Feeds re-validate on remount after 30s; community detail and search
        // override per-key (see lib/queries/*/use-*.ts in C2).
        staleTime: 30_000,
        // Keep cache 5min after unmount for back-nav warmth.
        gcTime: 5 * 60_000,
        // Forum-style traffic doesn't benefit from focus-refetches.
        refetchOnWindowFocus: false,
        // One retry, then surface the error (hooks turn errors into toasts).
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) {
    // Server: always a fresh client per request, never share across requests.
    return makeQueryClient();
  }
  // Client: lazy-init a single shared instance.
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```

- [x] **Step 2: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Commit**

```bash
git add lib/queries/client.ts
git commit -m "feat: QueryClient factory (per-request server / singleton client)"
```

---

## Task 4: QueryProvider component

**Files:**
- Create: `lib/queries/provider.tsx`

- [x] **Step 1: Write the provider**

Create `lib/queries/provider.tsx`:

```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./client";

/**
 * Mounts the TanStack Query client and dev-only devtools.
 * Place inside the root provider tree between Jotai (UI state) and Chakra.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

- [x] **Step 2: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Commit**

```bash
git add lib/queries/provider.tsx
git commit -m "feat: QueryProvider client component with dev-only devtools"
```

---

## Task 5: Wire QueryProvider into root providers

**Files:**
- Modify: `app/providers.tsx`

Current `app/providers.tsx` is:

```tsx
"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <JotaiProvider>
      <EmotionRegistry>
        <ChakraProvider value={theme}>
          <ColorModeProvider>
            <Layout>{children}</Layout>
          </ColorModeProvider>
          {mounted && <Toaster />}
        </ChakraProvider>
      </EmotionRegistry>
    </JotaiProvider>
  );
}
```

- [x] **Step 1: Add QueryProvider import and wrap children**

Edit `app/providers.tsx` to import `QueryProvider` from `@/lib/queries/provider` and wrap the tree. Final file:

```tsx
"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/queries/provider";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <JotaiProvider>
      <QueryProvider>
        <EmotionRegistry>
          <ChakraProvider value={theme}>
            <ColorModeProvider>
              <Layout>{children}</Layout>
            </ColorModeProvider>
            {mounted && <Toaster />}
          </ChakraProvider>
        </EmotionRegistry>
      </QueryProvider>
    </JotaiProvider>
  );
}
```

Note: ordering rationale — Jotai wraps everything (UI atoms stable across full app); QueryProvider wraps Chakra so any component rendered under Chakra (which is everything) can use TanStack hooks.

- [x] **Step 2: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: clean.

- [x] **Step 3: Lint**

Run:

```bash
pnpm lint
```

Expected: clean (the existing `set-state-in-effect` suppression on line 22 is unrelated — it stays for now; killed in C4).

- [x] **Step 4: Commit**

```bash
git add app/providers.tsx
git commit -m "feat: mount QueryProvider in root provider tree"
```

---

## Task 6: Boot smoke check

**Files:** none

- [x] **Step 1: Build verifies the wiring**

Run:

```bash
pnpm build
```

Expected: clean build. No type errors, no provider mount errors.

- [x] **Step 2: Start dev server and confirm app boots**

Run in a separate terminal:

```bash
pnpm dev
```

Then in browser, open `http://localhost:3000`. Confirm:
- Page renders normally (no white screen)
- React Query Devtools floating button appears in the lower-left corner (clicking it opens the devtools panel)
- No new console errors related to QueryClientProvider

Stop the dev server (Ctrl+C) when confirmed.

- [x] **Step 3: No commit needed (verification only)**

If anything failed in Step 1 or Step 2, fix before continuing. Common issues:
- Devtools button missing → check `NODE_ENV` (dev should expose it)
- Hydration warning → confirm the `'use client'` directive is in `provider.tsx`

---

## Task 7: Perf baseline document — template + suspected hot spots

**Files:**
- Create: `docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md`

This task has two halves. Half A is mechanical (the executor writes the template + code-derived hypotheses). Half B is **user-assisted** — actual browser measurements require a human at the keyboard with Chrome DevTools open. Half B blocks C2.

- [ ] **Step 1: Write the baseline template with code-derived hypotheses**

Create `docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md`:

```markdown
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
```

- [ ] **Step 2: Commit the template (template-only commit)**

```bash
git add docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md
git commit -m "docs: perf baseline template with code-derived hypotheses (C1)"
```

- [ ] **Step 3: User-assisted measurement (BLOCKS C2)**

Run from the project root:

```bash
pnpm dev
```

For each route (`/`, `/community/[id]`, `/community/[id]/comments/[pid]`, `/community/[id]/submit`):

1. Open Chrome DevTools → Performance tab
2. Set CPU throttle to 4× slowdown, network to "Fast 3G"
3. Click "Record", reload the page, interact (scroll the feed / open the post / focus the form), wait ~5s, stop recording
4. Note LCP from the summary
5. Switch to React DevTools → Profiler, record the same interaction, count the render commits and top 5 components by render time
6. Note count of server-action requests in Network (`/_next/action/...`)
7. For each hypothesis (H1–H4), confirm or refute based on what you saw
8. Fill in the baseline section of the doc

- [ ] **Step 4: Commit measurements**

```bash
git add docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md
git commit -m "docs: record Phase C baseline measurements (C1 complete)"
```

- [ ] **Step 5: Tick the C1 sign-off box**

Edit the doc, change `- [ ]` to `- [x]` for the four sign-off items at the bottom. Commit:

```bash
git add docs/superpowers/specs/2026-05-20-forum-phase-c-perf-baseline.md
git commit -m "docs: C1 sign-off — ready for C2"
```

---

## Task 8: Green gate

**Files:** none

- [ ] **Step 1: Run the full green gate**

Run sequentially (stop on first failure):

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected:
- `pnpm test` — vitest green, new `keys.test.ts` passes
- `pnpm typecheck` — clean
- `pnpm lint` — clean (no new violations; existing suppressions in legacy hooks unchanged)
- `pnpm build` — clean

- [ ] **Step 2: Verify devtools still work**

Run:

```bash
pnpm dev
```

Open `http://localhost:3000`, confirm React Query Devtools floating button is present, click to open panel. Stop the dev server.

- [ ] **Step 3: Open PR**

The branch is `feat/phase-c-tanstack-query`. Push:

```bash
git push -u origin feat/phase-c-tanstack-query
```

Open PR titled: `feat: Phase C1 — TanStack Query foundation + perf baseline`

PR body checklist:
- [ ] `lib/queries/{client,keys,provider}.ts` created
- [ ] `QueryProvider` mounted in `app/providers.tsx`
- [ ] Devtools visible in dev, gated out of production build
- [ ] keys.test.ts passing
- [ ] Perf baseline doc filled for all four routes
- [ ] All four C1 sign-off items checked
- [ ] `pnpm test && pnpm typecheck && pnpm lint && pnpm build` clean

---

## C1 Green Gate Summary

Phase C1 is done when:

1. Branch `feat/phase-c-tanstack-query` has all 8 tasks landed
2. `pnpm test && pnpm typecheck && pnpm lint && pnpm build` passes
3. App boots; devtools visible in dev, absent in production build
4. Perf baseline doc filled with measurements for all four routes
5. Each of H1–H5 marked confirmed / refuted / deferred
6. C1 sign-off section checked

Once green, the C2 plan can be written (use the baseline findings to prioritize which routes/hooks get HydrationBoundary first and which atom-widening sources are highest-impact to delete).
