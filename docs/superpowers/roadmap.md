# Forum De-Firebase Migration — Roadmap

Status snapshot of the multi-phase migration from Firebase to the house stack
(Postgres + Drizzle, Better Auth as sibling, Cloudflare R2, TanStack Query +
Jotai, shadcn + Tailwind, latest Next.js).

Last updated: **2026-05-21**.

---

## Phase A — Postgres data layer + sibling auth ✅ DONE

Replaces Firestore + Firebase Auth + Cloud Functions with Postgres + Drizzle +
Better Auth (sibling of `login.projectconfucius.id`). Fresh database, no data
migration. Two Postgres connections (`authDb` read-only + forum `db`).
`provisionLocalUser` relinks by email to avoid P2002 on the dual-unique keys.

- Spec: [`2026-05-19-forum-phase-a-postgres-sibling-auth-design.md`](specs/2026-05-19-forum-phase-a-postgres-sibling-auth-design.md)
- Plan: [`2026-05-19-forum-phase-a-postgres-sibling-auth.md`](plans/2026-05-19-forum-phase-a-postgres-sibling-auth.md)
- Branch: merged to `main` 2026-05-19

---

## Phase B — Storage → R2 ✅ DONE

Cloudflare R2 with S3-API client + presigned uploads replaces Firebase Storage.
Post images, community logos, profile images covered. `firebase` package
removed entirely; the `firebase-storage` half of the codebase is gone.

- Spec: [`2026-05-20-forum-phase-b-r2-storage-design.md`](specs/2026-05-20-forum-phase-b-r2-storage-design.md)
- Plan: [`2026-05-20-forum-phase-b-r2-storage.md`](plans/2026-05-20-forum-phase-b-r2-storage.md)
- Branch: merged to `main` 2026-05-20

---

## Phase C — State → TanStack Query ✅ DONE (with active polish)

Server state moved out of Jotai + manual fetch-in-effect into TanStack Query
with a typed query-keys factory. Jotai retained for true UI/client state only.
Delivered in three sub-plans: foundation (C1), reads (C2), mutations (C3).
Recent polish on `main`: optimistic UI for vote/delete, `useInfiniteQuery`
migration, removal of `uiAtom.selectedPost` / `uiAtom.currentCommunity` local
mirrors via `useActiveCommunity`.

- Specs:
  - [`2026-05-20-forum-phase-c-tanstack-query-design.md`](specs/2026-05-20-forum-phase-c-tanstack-query-design.md)
  - [`2026-05-20-forum-phase-c-perf-baseline.md`](specs/2026-05-20-forum-phase-c-perf-baseline.md)
  - [`2026-05-20-forum-phase-c3-mutations-design.md`](specs/2026-05-20-forum-phase-c3-mutations-design.md)
  - [`2026-05-21-forum-local-state-mirror-elimination-design.md`](specs/2026-05-21-forum-local-state-mirror-elimination-design.md)
- Plans:
  - [`2026-05-20-forum-phase-c1-foundation.md`](plans/2026-05-20-forum-phase-c1-foundation.md)
  - [`2026-05-20-forum-phase-c2-reads.md`](plans/2026-05-20-forum-phase-c2-reads.md)
  - [`2026-05-20-forum-phase-c3-posts-mutations.md`](plans/2026-05-20-forum-phase-c3-posts-mutations.md)
  - [`2026-05-21-forum-phase-c3-remaining-mutations.md`](plans/2026-05-21-forum-phase-c3-remaining-mutations.md)
  - [`2026-05-21-forum-local-state-mirror-elimination.md`](plans/2026-05-21-forum-local-state-mirror-elimination.md)
- Outstanding follow-ups tracked in [`backlog.md`](backlog.md): join/save
  optimistic UI, staleTime + drop redundant vote invalidations.

---

## Phase D — UI → shadcn (PCF redesign) ⏳ DESIGN APPROVED · plan pending

**Scope expanded** from the Phase A spec's "faithful re-skin" goal into a
**creative redesign** with the migration as the occasion. New visual language
(Mountain Jade + Inter/Source Serif 4 + Considered-Modern springs), Tier 3
restructuring (visual + IA + layout reflow), inline-expand composer fixing the
deceptive create-post flow, Next.js intercepting routes + shared-element morph
for post detail, Reddit-style threaded comments (5-deep inline + Continue-this-
thread sub-route). App renamed: **projectconfucius forum** (`PCF` in tight
slots).

One long-lived branch (`feat/phase-d-pcf-redesign`), 8 phased commits, one
atomic merge PR. Chakra + shadcn coexist through phases 1–7; teardown is phase
8. Chakra UI v3, Emotion, framer-motion 12.x (unused), and Open Sans all gone
at the end.

- Spec: [`2026-05-21-forum-phase-d-pcf-redesign-design.md`](specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)
  (commit `4955e48`)
- Plan: pending — to be drafted next.
- Branch: `feat/phase-d-pcf-redesign` (not yet cut).
- Notable: **Phase E is folded into D** — UI is the terminal phase.

---

## Phase E — Folded into D

Originally sketched as a separate "final polish" phase in the Phase A spec.
Now part of Phase D's phase-8 teardown step.

---

## Sequencing & dependencies

```
A (data + auth)  ──┐
                   ├──→  C (state)  ──→  D (UI)
B (storage)  ─────┘
```

A and B were independently mergeable. C depended on A's domain types but not
on B. D depends on C: the new UI consumes the TanStack Query hooks established
in C without modification.

After D merges, the migration is complete — no Firebase deps, no Chakra deps,
no Emotion deps, no legacy Open Sans, all routes on the new `/c/[id]/...`
shape, app renamed to PCF.

---

## Side projects (not phases)

These shipped alongside the main phases but aren't part of the
A → B → C → D sequence.

- **Username & image sync from auth session** (2026-05-21): `provisionLocalUser`
  pulls `username` and `image` from the central auth session; renames stop
  fanning out to caches; UI renders `u/<username>` via `formatUserHandle`.
  - Spec: [`2026-05-21-forum-username-and-image-sync-design.md`](specs/2026-05-21-forum-username-and-image-sync-design.md)
  - Plan: [`2026-05-21-plan-2-forum-username-and-image-sync.md`](plans/2026-05-21-plan-2-forum-username-and-image-sync.md)

---

## Out of scope (post-migration backlog)

Tracked in detail in [`backlog.md`](backlog.md). High-level themes that are
explicitly post-D:

- Real-time vote/comment updates (Postgres LISTEN/NOTIFY or websockets)
- Notifications / inbox
- Federation / ActivityPub
- Native mobile apps
- Moderator tools beyond `/c/[id]/settings/admins`
- Markdown-rendering polish
- Community cover banner image (in current backlog)
- `useInfiniteQuery` for the remaining manual-cursor hooks (in current backlog)
