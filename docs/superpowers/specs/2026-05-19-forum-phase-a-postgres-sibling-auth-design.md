# Forum De-Firebase — Phase A: Postgres data layer + sibling auth

**Date:** 2026-05-19
**Repo:** `projectconfucius-forum` ("Circus Discussions")
**Status:** Design approved, spec under user review

## 1. Context & goal

The forum is a Reddit-style discussion platform built end-to-end on Firebase:
Firestore (all data), Firebase Auth (email/password + Google + GitHub),
Firebase Storage (images), and Cloud Functions (user-doc sync + saved-post
cleanup). The goal is to remove Firebase entirely and adopt the house stack:
Postgres + Drizzle, Better Auth (as a **sibling** of the central
`login.projectconfucius.id` app), Cloudflare R2, TanStack Query + Jotai,
shadcn, pnpm, latest deps.

The full migration is decomposed into five sub-projects. **This spec covers
Phase A only**: the Postgres data layer and sibling auth integration, which
are tightly coupled (Better Auth needs Drizzle/Postgres; forum author rows
reference the auth identity). Phases B–E have goals recorded in §8 and get
their own spec → plan → implementation cycles.

Decisions locked during brainstorming:
- Database: **Postgres + Drizzle** (consistency with other house apps).
- Hosting: **Vercel + Neon Postgres**; forum host **`forum.projectconfucius.id`**.
- **Fresh database, no Firestore data migration.**
- Auth: **no signin/signup in the forum** — it consumes central auth at
  `login.projectconfucius.id` as a sibling, exactly like `formdataumat` /
  `makinsegar-app`.
- Denormalized counters (`voteStatus`, `numberOfComments`,
  `numberOfMembers`): **kept** as stored columns updated transactionally.
- UI re-skin (Phase D): **faithful re-skin**, not a redesign.

## 2. Architecture

Two Postgres connections, mirroring `formdataumat`:

- **`authDb`** (`lib/db/auth-db.ts`) — connects to the **shared auth
  Postgres** via `AUTH_DATABASE_URL` (the `auth_sibling` read role).
  Drizzle schema declares only `user`, `session`, `account`, `verification`.
  The forum never writes to this database.
- **`db`** (`lib/db/index.ts`) — the forum's **own Neon Postgres** via
  `DATABASE_URL`. Holds all forum domain tables.

`postgres-js` driver, `{ prepare: false, max: 5 }`, same as the sibling apps.

### Session & identity flow

1. Request hits the forum. Server guard calls
   `auth.api.getSession({ headers })` (Better Auth reading the **shared
   `session` table** through `authDb`).
2. No session → redirect to `/api/auth/start?callbackUrl=<path>`, a Route
   Handler that 303-redirects to
   `https://login.projectconfucius.id/sign-in?callbackURL=<absolute forum url>`.
3. Valid session → `provisionLocalUser({ authUserId, email, name })` ensures
   a local `users` row exists before any forum query runs.

The shared `.projectconfucius.id` cookie (already configured in the central
app via `crossSubDomainCookies`) is sent to `forum.projectconfucius.id`
automatically once the host is trusted (see §6 cross-repo change).

## 3. Forum domain schema (Drizzle, Postgres)

Derived from existing `types/*` and Firestore collections.

- **`users`** — local mirror. `id` (text pk), `authUserId` (unique, not
  null), `email` (unique, not null, lowercased), `name`, `imageUrl`
  (nullable), `createdAt`, `updatedAt`.
- **`communities`** — `id` (text pk = community name), `creatorId` (FK
  `users.id`), `privacyType` enum `public|restricted|private`, `imageUrl`
  (nullable), `numberOfMembers` int default 1, `createdAt`.
- **`community_members`** — `userId` (FK `users.id`, cascade), `communityId`
  (FK `communities.id`, cascade), `isModerator` bool default false,
  `createdAt`. Composite PK (`userId`,`communityId`). Replaces the old
  per-user `communitySnippets` subcollection.
- **`posts`** — `id` (text pk), `communityId` (FK `communities.id`, **ON
  DELETE CASCADE**), `creatorId` (FK `users.id`), `creatorDisplayName`,
  `title`, `body`, `imageUrl` (nullable), `numberOfComments` int default 0,
  `voteStatus` int default 0, `createdAt`. Indexes: `(communityId,
  createdAt desc)`, `(voteStatus desc)`.
- **`comments`** — `id` (text pk), `postId` (FK `posts.id`, cascade),
  `parentId` (self-FK nullable, cascade) for threads, `creatorId` (FK
  `users.id`), `creatorDisplayText`, `text`, `createdAt`. Index `(postId,
  createdAt desc)`.
- **`post_votes`** — `id` (text pk), `userId` (FK `users.id`, cascade),
  `postId` (FK `posts.id`, cascade), `communityId`, `voteValue` smallint
  (`-1` | `1`). Unique (`userId`,`postId`).
- **`saved_posts`** — `userId` (FK `users.id`, cascade), `postId` (FK
  `posts.id`, **ON DELETE CASCADE**), `createdAt`. Composite PK. The cascade
  FK replaces the `deleteSavedPost` Cloud Function.

Both Cloud Functions (`createUserDocument`, `deleteUserDocument`) are
obsoleted by `provisionLocalUser` and deleted with the rest of `functions/`.

## 4. Sibling auth integration

- **`lib/auth.ts`** — `betterAuth({ database: drizzleAdapter(authDb, {
  provider: "pg", schema: { user, session, account, verification } }),
  baseURL: BETTER_AUTH_URL, secret: BETTER_AUTH_SECRET, trustedOrigins,
  user: { additionalFields: { role: { type:"string", input:false,
  required:false, fieldName:"roles" } } } })`. **No** `emailAndPassword`,
  **no** `socialProviders`, **no** `admin` plugin (sibling mode). The
  `role→roles` mapping is required or role checks fail closed.
  `trustedOrigins`: `https://forum.projectconfucius.id`,
  `https://projectconfucius.id`, `https://www.projectconfucius.id`,
  `https://login.projectconfucius.id`, `http://localhost:3000`.
- **`lib/auth-client.ts`** — `createAuthClient({ baseURL:
  NEXT_PUBLIC_BETTER_AUTH_URL })`. Used only for `useSession` / `signOut`.
- **`app/api/auth/[...all]/route.ts`** — Better Auth request handler.
- **`app/api/auth/start/route.ts`** — Route Handler (NOT a Server Action —
  cross-origin redirect under any basePath must be a plain 303). Resolves an
  absolute callback URL on the forum origin, redirects to the central
  `/sign-in?callbackURL=`.
- **`app/api/auth/signout/route.ts`** — sign out then redirect home.
- **Server guard** (`lib/auth/guards.ts` or `middleware.ts`) —
  `getSession`; null → `/api/auth/start`; authenticated → `provisionLocalUser`.
- **`lib/auth/provision.ts`** — `provisionLocalUser`: find by `authUserId`
  → else relink the row found by `email` to the new `authUserId` → else
  create. Avoids P2002 on the dual unique keys (the established dual-key
  pattern).

### Deletions (auth UI removed entirely)

`firebase/`, `functions/`, `.firebaserc`, `firebase.json`;
`components/modal/auth/*` (AuthModal, Login, Signup, ResetPassword,
AuthInputs, InputField), `components/modal/auth/oauth-buttons/*`,
`atoms/authModalAtom.ts`, `schema/auth.ts`; auth-modal triggers in the
navbar. "Log in" / "Sign up" controls become links to `/api/auth/start`.
Deps removed: `firebase`, `firebase-admin`, `firebase-functions`,
`react-firebase-hooks`.

## 5. Data layer rewrite

All ~50 `lib/*` Firestore functions are rewritten as Drizzle queries
against `db`, preserving signatures and return shapes where possible so
hooks/components change minimally.

- Pagination: Firestore `startAfter(snapshot)` → keyset pagination on
  `(createdAt, id)` for feeds, `(voteStatus, id)` for the guest vote-ranked
  feed. The cursor type changes from a `QueryDocumentSnapshot` to an opaque
  `{ createdAt; id }` (or `{ voteStatus; id }`); callers pass it back
  verbatim, same as before.
- Mutations that touch counters (vote, comment create/delete, join/leave,
  community delete) run inside a Drizzle transaction that updates the
  denormalized column (`voteStatus` / `numberOfComments` /
  `numberOfMembers`) atomically.
- Community delete relies on `ON DELETE CASCADE` for posts → comments →
  votes → saved_posts; no manual batch cleanup.

## 6. Cross-repo change (`projectconfucius-auth`)

Small, explicitly scoped, deployed **before** the forum goes live:
- Add `"forum.projectconfucius.id"` to `ALLOWED_HOSTS` in
  `projectconfucius-auth/lib/auth.ts`.
- `https://forum.projectconfucius.id` then flows into `trustedOriginsProd`
  automatically (it maps over `ALLOWED_HOSTS`).
- Cookie domain is already `.projectconfucius.id`; no other auth-repo change.
- Provision an `auth_sibling` read-only DB role / `AUTH_DATABASE_URL` for
  the forum if a per-app credential is preferred (matches formdataumat).

## 7. Packages & tooling

- Remove: `firebase`, `firebase-admin`, `firebase-functions`,
  `react-firebase-hooks`.
- Add: `better-auth`, `drizzle-orm`, `drizzle-kit` (dev), `postgres`.
- Pin `better-auth`, `next`, `drizzle-orm` to the versions used by the other
  sibling apps (`makinsegar-app`/`formdataumat`) for cross-app consistency;
  bump remaining deps to latest.
- Delete `yarn.lock`; pnpm only (pnpm-lock.yaml already present).
- Add `drizzle.config.ts`, `drizzle/` migrations dir, scripts
  `db:generate` / `db:migrate`. **The user runs migrate/destructive DB
  commands** — the plan provides the exact commands, does not dispatch them.
- `.env.example` updated: `DATABASE_URL`, `AUTH_DATABASE_URL`,
  `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL`;
  Firebase vars removed.
- Vitest retained. New tests: `provisionLocalUser` (find/relink/create),
  schema cascade behavior, representative rewritten data functions.

### Phase A done = green gate

`pnpm test`, `pnpm typecheck` (or `tsc --noEmit` per project setup),
`pnpm lint`, `pnpm build` all pass; app boots, an authenticated user
(signed in via the central app) can load feeds and the dev DB has the
forum schema. No Firebase auth/Firestore/Functions code remains; Firebase
**Storage** code may still remain (removed in Phase B).

## 8. Roadmap — Phases B–E (goals only; specced later)

- **Phase B — Storage → R2.** Goal: **zero Firebase dependencies remain.**
  S3-API client + presigned uploads; post images, community logos, profile
  images move to R2 (read + write + delete); Firebase Storage removed;
  `firebase` package gone entirely.
- **Phase C — State → TanStack Query.** Goal: **no manual
  fetch-in-effect; mutations invalidate cache.** Server state via TanStack
  Query; Jotai retained for UI/modal/client state; ~25 hooks refactored.
- **Phase D — UI → shadcn.** Goal: **visual parity, no Chakra/Emotion
  deps.** Faithful re-skin of ~90 components from Chakra UI v3 to shadcn +
  Tailwind; `@chakra-ui/*`, `@emotion/*`, `framer-motion` (if unused)
  removed.
- **Phase E** folds into D (UI is the terminal phase).

Each phase: independent branch, own spec → plan → green gate.

## 9. Non-goals

- No Firestore → Postgres data migration (fresh DB).
- No new auth features beyond what the central app already provides.
- No UI redesign (faithful re-skin only, and not in Phase A).
- No unrelated refactoring of code the migration doesn't touch.
