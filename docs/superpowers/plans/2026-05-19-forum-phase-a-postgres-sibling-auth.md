# Forum Phase A — Postgres data layer + sibling auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Firebase Auth/Firestore/Functions from `projectconfucius-forum` and replace them with Postgres + Drizzle and a sibling Better Auth that consumes the central `login.projectconfucius.id` app (no signin/signup in the forum).

**Architecture:** Two Postgres connections — `authDb` (read-only, shared auth DB: `user/session/account/verification`) and `db` (forum's own Neon DB: communities/posts/comments/votes/members/saved/users). Unauthenticated requests redirect to the central login app; authenticated requests provision a local `users` row via the dual-key relink pattern. Firebase Storage is intentionally left for Phase B.

**Tech Stack:** Next.js 16 (App Router), Better Auth (sibling mode, Drizzle adapter), drizzle-orm + drizzle-kit, postgres-js, Neon Postgres, Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-05-19-forum-phase-a-postgres-sibling-auth-design.md`

**Conventions for the executor:**
- Path alias `@/*` → repo root (e.g. `@/lib/db` → `lib/db/index.ts`).
- The **user runs all DB migrate/destructive commands** — when a step needs `drizzle-kit generate`/`migrate`, the step says "STOP: ask the user to run `<cmd>`" rather than running it.
- Green gate (run after every task and at the end): `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.
- Commit after every task with the message shown.
- Branch: work happens on `feat/phase-a-postgres-sibling-auth` (already created).

---

## File structure (created/removed in Phase A)

**Created:**
- `lib/db/index.ts` — forum Neon connection + Drizzle instance
- `lib/db/schema.ts` — forum domain Drizzle schema
- `lib/db/auth-db.ts` — read-only connection to shared auth Postgres
- `lib/db/auth-schema.ts` — Drizzle schema for `user/session/account/verification`
- `lib/auth.ts` — sibling Better Auth instance
- `lib/auth-client.ts` — Better Auth React client → central login app
- `lib/auth/provision.ts` — `provisionLocalUser` dual-key relink helper
- `lib/auth/session.ts` — `getAppSession()` + `requireUser()` server helpers
- `app/api/auth/[...all]/route.ts` — Better Auth handler
- `app/api/auth/start/route.ts` — redirect to central sign-in
- `app/api/auth/signout/route.ts` — sign out + redirect home
- `middleware.ts` — gate protected routes
- `drizzle.config.ts` — drizzle-kit config
- `drizzle/` — generated migrations
- `tests/**` — unit tests

**Removed:**
- `firebase/` (clientApp.ts, errors.ts), `functions/`, `.firebaserc`, `firebase.json`
- `components/modal/auth/` (entire dir incl. `oauth-buttons/`), `atoms/authModalAtom.ts`, `schema/auth.ts`, `types/authModal.ts`
- `yarn.lock`
- deps: `firebase`, `firebase-admin`, `firebase-functions`, `react-firebase-hooks`

**Modified:** all `lib/*` data functions, all `types/*` (drop `Timestamp`), ~25 hooks, auth-consuming components (navbar, modals, layout `GlobalHooks`).

---

## Task 1: Dependencies, pnpm, tooling cleanup

**Files:**
- Modify: `package.json`
- Delete: `yarn.lock`, `.firebaserc`, `firebase.json`, `firebase/`, `functions/`
- Create: `.env.example` (overwrite)

- [x] **Step 1: Remove Firebase, add Postgres/auth deps**

Run:
```bash
pnpm remove firebase firebase-admin firebase-functions react-firebase-hooks
pnpm add better-auth@1.6.11 drizzle-orm@^0.45.2 postgres
pnpm add -D drizzle-kit
```
(Pin `better-auth@1.6.11` to match `makinsegar-app`/`formdataumat` for cross-app session compatibility — do not bump to latest.)

- [x] **Step 2: Delete Firebase project files**

Run:
```bash
git rm -r firebase functions .firebaserc firebase.json yarn.lock
```

- [x] **Step 3: Overwrite `.env.example`**

```
# Forum's own Neon Postgres
DATABASE_URL=postgres://user:pass@host/forum

# Shared auth Postgres (auth_sibling read role) — provided by projectconfucius-auth owner
AUTH_DATABASE_URL=postgres://auth_sibling:pass@host/auth

# Better Auth (sibling)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=dev-secret-change-me
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:4000
```

> **Note for executor:** `AUTH_DATABASE_URL` must point at the same Postgres `projectconfucius-auth` uses, ideally via a read-only `auth_sibling` role. If that credential does not exist yet, STOP and ask the user to provision it in the auth project before Task 8 can be verified end-to-end.

- [x] **Step 4: Add db scripts to `package.json`**

Add to `scripts`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

- [x] **Step 5: Verify install**

Run: `pnpm install && pnpm exec tsc --noEmit`
Expected: install succeeds; tsc will still error on files importing `firebase` — that is expected and fixed in later tasks. Confirm no dependency-resolution errors.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Firebase deps/files, add Drizzle+Better Auth, pnpm-only

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Forum domain Drizzle schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`
- Create: `drizzle.config.ts`
- Test: `tests/db/schema.test.ts`

- [x] **Step 1: Write `lib/db/schema.ts`**

```ts
import { pgTable, text, integer, smallint, boolean, timestamp, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";

export const privacyEnum = pgEnum("privacy_type", ["public", "restricted", "private"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communities = pgTable("communities", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  privacyType: privacyEnum("privacy_type").notNull().default("public"),
  imageUrl: text("image_url"),
  numberOfMembers: integer("number_of_members").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  isModerator: boolean("is_moderator").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.communityId] })]);

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  creatorId: text("creator_id").notNull().references(() => users.id),
  creatorUsername: text("creator_username").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  communityImageUrl: text("community_image_url"),
  numberOfComments: integer("number_of_comments").notNull().default(0),
  voteStatus: integer("vote_status").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("posts_community_created_idx").on(t.communityId, t.createdAt.desc()),
  index("posts_vote_idx").on(t.voteStatus.desc()),
]);

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  communityId: text("community_id").notNull(),
  postTitle: text("post_title").notNull(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  creatorDisplayText: text("creator_display_text").notNull(),
  text: text("text").notNull(),
  depth: integer("depth").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("comments_post_created_idx").on(t.postId, t.createdAt.desc())]);

export const postVotes = pgTable("post_votes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  communityId: text("community_id").notNull(),
  voteValue: smallint("vote_value").notNull(),
}, (t) => [uniqueIndex("post_votes_user_post_idx").on(t.userId, t.postId)]);

export const savedPosts = pgTable("saved_posts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  communityId: text("community_id").notNull(),
  postTitle: text("post_title").notNull(),
  communityImageUrl: text("community_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);
```

Self-FK note: `comments.parentId` is declared without a Drizzle `.references()` to avoid the circular-reference TS pitfall; the FK with `ON DELETE CASCADE` is added in the generated SQL migration manually in Task 3 Step 2.

- [x] **Step 2: Write `lib/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = postgres(connectionString, { prepare: false, max: 5 });
export const db = drizzle(client, { schema });
export * as schema from "./schema";
```

- [x] **Step 3: Write `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [x] **Step 4: Write the failing test `tests/db/schema.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";

describe("forum schema", () => {
  it("exposes all domain tables", () => {
    for (const t of ["users","communities","communityMembers","posts","comments","postVotes","savedPosts"]) {
      expect(schema[t as keyof typeof schema]).toBeDefined();
    }
  });
  it("posts has denormalized counters", () => {
    expect(schema.posts.voteStatus).toBeDefined();
    expect(schema.posts.numberOfComments).toBeDefined();
  });
});
```

- [x] **Step 5: Run test**

Run: `pnpm test tests/db/schema.test.ts`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add lib/db/schema.ts lib/db/index.ts drizzle.config.ts tests/db/schema.test.ts
git commit -m "feat: forum Postgres Drizzle schema + connection

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Generate & apply forum migration

**Files:**
- Create: `drizzle/*` (generated)

- [x] **Step 1: STOP — ask the user to generate the migration**

Tell the user to run: `pnpm db:generate`
(The user runs DB tooling. Wait for them to confirm `drizzle/` was created.)

- [x] **Step 2: Add the `comments.parent_id` self-FK to the generated SQL**

In the newly generated `drizzle/0000_*.sql`, append after the `comments` table creation:
```sql
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE;
```

- [x] **Step 3: STOP — ask the user to apply the migration**

Tell the user to run (with a real `DATABASE_URL` pointing at a dev Neon DB): `pnpm db:migrate`
Wait for confirmation that tables exist.

- [x] **Step 4: Commit**

```bash
git add drizzle
git commit -m "feat: initial forum schema migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Auth schema + read-only auth DB connection

**Files:**
- Create: `lib/db/auth-schema.ts`
- Create: `lib/db/auth-db.ts`
- Test: `tests/db/auth-db.test.ts`

- [x] **Step 1: Write `lib/db/auth-schema.ts`**

Mirror the four Better Auth core tables (column names match the central app's Postgres). Source of truth: `projectconfucius-auth` schema. Minimum needed by the Drizzle adapter:

```ts
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  roles: text("roles"),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});
```

> **Executor note:** Before relying on this, open `projectconfucius-auth/lib/db/schema.ts` (per memory `reference_better_auth_schema_drift`, the live schema is there) and reconcile exact column names/casing. Adjust if the central schema differs. Do NOT run `drizzle-kit` against the auth DB — the forum never migrates it.

- [x] **Step 2: Write `lib/db/auth-db.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";

const connectionString = process.env.AUTH_DATABASE_URL;
if (!connectionString) throw new Error("AUTH_DATABASE_URL is not set (auth_sibling connection)");

const client = postgres(connectionString, { prepare: false, max: 5 });
export const authDb = drizzle(client, { schema: authSchema });
```

- [x] **Step 3: Write test `tests/db/auth-db.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import * as s from "@/lib/db/auth-schema";

describe("auth schema mirror", () => {
  it("declares the four Better Auth core tables", () => {
    expect(s.user).toBeDefined();
    expect(s.session).toBeDefined();
    expect(s.account).toBeDefined();
    expect(s.verification).toBeDefined();
  });
});
```

- [x] **Step 4: Run test**

Run: `pnpm test tests/db/auth-db.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/db/auth-schema.ts lib/db/auth-db.ts tests/db/auth-db.test.ts
git commit -m "feat: read-only shared-auth Postgres connection + schema mirror

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Sibling Better Auth instance + client

**Files:**
- Create: `lib/auth.ts`, `lib/auth-client.ts`
- Create: `app/api/auth/[...all]/route.ts`

- [x] **Step 1: Write `lib/auth.ts`**

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authDb } from "./db/auth-db";
import * as authSchema from "./db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(authDb, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  // Sibling mode: NO emailAndPassword, NO socialProviders, NO admin plugin.
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "https://forum.projectconfucius.id",
    "https://projectconfucius.id",
    "https://www.projectconfucius.id",
    "https://login.projectconfucius.id",
    "http://localhost:3000",
  ],
  // REQUIRED — sibling has no admin plugin; maps property `role` → DB column
  // `roles`. Without it every role check fails closed.
  user: {
    additionalFields: {
      role: { type: "string", input: false, required: false, fieldName: "roles" },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

- [x] **Step 2: Write `lib/auth-client.ts`**

```ts
"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:4000",
});

export const { useSession, signOut } = authClient;
```

- [x] **Step 3: Write `app/api/auth/[...all]/route.ts`**

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

- [x] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit lib/auth.ts lib/auth-client.ts`
Expected: no errors in these files (other files still reference Firebase — ignore those).

- [x] **Step 5: Commit**

```bash
git add lib/auth.ts lib/auth-client.ts app/api/auth
git commit -m "feat: sibling Better Auth instance + client + handler

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: `provisionLocalUser` dual-key helper

**Files:**
- Create: `lib/auth/provision.ts`
- Test: `tests/auth/provision.test.ts`

- [x] **Step 1: Write failing test `tests/auth/provision.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const insert = vi.fn();
const update = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: { users: { findFirst } },
    insert: () => ({ values: () => ({ returning: insert }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: update }) }) }),
  },
}));

import { provisionLocalUser } from "@/lib/auth/provision";

beforeEach(() => { findFirst.mockReset(); insert.mockReset(); update.mockReset(); });

describe("provisionLocalUser", () => {
  it("returns the row found by authUserId", async () => {
    findFirst.mockResolvedValueOnce({ id: "u1" });
    const r = await provisionLocalUser({ authUserId: "a1", email: "X@x.com", name: "X" });
    expect(r.id).toBe("u1");
  });

  it("relinks the email row when authUserId misses", async () => {
    findFirst.mockResolvedValueOnce(undefined);          // by authUserId
    findFirst.mockResolvedValueOnce({ id: "u2" });        // by email
    update.mockResolvedValueOnce([{ id: "u2" }]);
    const r = await provisionLocalUser({ authUserId: "a2", email: "Y@y.com", name: "Y" });
    expect(r.id).toBe("u2");
    expect(update).toHaveBeenCalled();
  });

  it("creates when neither key matches", async () => {
    findFirst.mockResolvedValueOnce(undefined);
    findFirst.mockResolvedValueOnce(undefined);
    insert.mockResolvedValueOnce([{ id: "u3" }]);
    const r = await provisionLocalUser({ authUserId: "a3", email: "Z@z.com", name: "Z" });
    expect(r.id).toBe("u3");
    expect(insert).toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test tests/auth/provision.test.ts`
Expected: FAIL (`provisionLocalUser` not found).

- [x] **Step 3: Write `lib/auth/provision.ts`**

```ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Find-or-relink-or-create the local users row for a Better Auth identity.
 * `authUserId` and `email` are both unique. If the authUserId lookup misses
 * but the email exists, relink that row (latest sign-in wins) instead of
 * creating a duplicate. See spec §2 / memory: dual-key provisioning.
 */
export async function provisionLocalUser(input: {
  authUserId: string;
  email: string;
  name: string;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email;

  const byAuth = await db.query.users.findFirst({
    where: eq(users.authUserId, input.authUserId),
    columns: { id: true },
  });
  if (byAuth) return { id: byAuth.id };

  const byEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (byEmail) {
    const [row] = await db.update(users)
      .set({ authUserId: input.authUserId, updatedAt: new Date() })
      .where(eq(users.id, byEmail.id))
      .returning({ id: users.id });
    return { id: row.id };
  }

  const [row] = await db.insert(users)
    .values({ id: randomUUID(), authUserId: input.authUserId, email, name })
    .returning({ id: users.id });
  return { id: row.id };
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test tests/auth/provision.test.ts`
Expected: PASS (all 3).

- [x] **Step 5: Commit**

```bash
git add lib/auth/provision.ts tests/auth/provision.test.ts
git commit -m "feat: provisionLocalUser dual-key relink helper

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Session helpers, auth routes, middleware

**Files:**
- Create: `lib/auth/session.ts`, `app/api/auth/start/route.ts`, `app/api/auth/signout/route.ts`, `middleware.ts`
- Test: `tests/auth/start-route.test.ts`

- [x] **Step 1: Write `lib/auth/session.ts`**

```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";

export async function getAppSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Server-side: require an authenticated user, ensure a local row exists. */
export async function requireUser() {
  const session = await getAppSession();
  if (!session?.user) redirect("/api/auth/start");
  const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  });
  return { session, userId: local.id };
}
```

- [x] **Step 2: Write `app/api/auth/start/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";

// MUST be a Route Handler (not a Server Action): a cross-origin redirect from
// a Server Action triggers a CORS preflight. A 303 is followed natively.
export async function GET(req: NextRequest) {
  const origin = new URL(
    process.env.BETTER_AUTH_URL ?? "https://forum.projectconfucius.id",
  ).origin;
  const raw = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const cb = /^https?:\/\//.test(raw) ? raw : new URL(raw, origin).toString();
  const url = new URL("https://login.projectconfucius.id/sign-in");
  url.searchParams.set("callbackURL", cb);
  return NextResponse.redirect(url, 303);
}
```

- [x] **Step 3: Write `app/api/auth/signout/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await auth.api.signOut({ headers: req.headers });
  return NextResponse.redirect(new URL("/", req.url), 303);
}
```

- [x] **Step 4: Write `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require an authenticated user. Read/list pages stay public
// (guest vote-ranked feed). Mutations are guarded server-side via requireUser.
const PROTECTED = [/^\/community\/[^/]+\/submit/];

export function middleware(req: NextRequest) {
  const needsAuth = PROTECTED.some((re) => re.test(req.nextUrl.pathname));
  if (!needsAuth) return NextResponse.next();
  const cookie = getSessionCookie(req);
  if (!cookie) {
    const url = new URL("/api/auth/start", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/community/:path*"] };
```

- [x] **Step 5: Write test `tests/auth/start-route.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/auth/start/route";
import { NextRequest } from "next/server";

describe("/api/auth/start", () => {
  it("303-redirects to central sign-in with absolute callbackURL", async () => {
    const req = new NextRequest("https://forum.projectconfucius.id/api/auth/start?callbackUrl=/communities");
    const res = await GET(req);
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin).toBe("https://login.projectconfucius.id");
    expect(loc.searchParams.get("callbackURL")).toMatch(/^https?:\/\//);
  });
});
```

- [x] **Step 6: Run test**

Run: `pnpm test tests/auth/start-route.test.ts`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add lib/auth/session.ts app/api/auth/start app/api/auth/signout middleware.ts tests/auth/start-route.test.ts
git commit -m "feat: session helpers, auth start/signout routes, route guard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Cross-repo — register forum host in `projectconfucius-auth`

**Files:**
- Modify: `C:\Users\sinta\projects\projectconfucius-auth\lib\auth.ts`

- [x] **Step 1: Add the forum host to `ALLOWED_HOSTS`**

In `projectconfucius-auth/lib/auth.ts`, change:
```ts
const ALLOWED_HOSTS = [
    "projectconfucius.id",
    "www.projectconfucius.id",
    "makinsegar.projectconfucius.id",
];
```
to add `"forum.projectconfucius.id",` as the last entry. `trustedOriginsProd` maps over `ALLOWED_HOSTS`, so `https://forum.projectconfucius.id` is included automatically. No cookie-domain change (already `.projectconfucius.id`).

- [x] **Step 2: Verify auth project still builds**

Run (in the auth repo): `cd C:\Users\sinta\projects\projectconfucius-auth && pnpm exec tsc --noEmit`
Expected: PASS.

- [x] **Step 3: Commit in the auth repo**

```bash
cd C:\Users\sinta\projects\projectconfucius-auth
git add lib/auth.ts
git commit -m "feat: trust forum.projectconfucius.id sibling origin

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

> **Executor note:** This change must be **deployed** to the central auth app before the forum is usable in production. Flag to the user; do not deploy automatically.

---

## Task 9: Rewrite `types/*` (drop Firestore `Timestamp`)

**Files:**
- Modify: `types/post.ts`, `types/community.ts`, `types/comment.ts`, `types/communityMember.ts`, `types/savedPost.ts`
- Delete: `types/authModal.ts`

- [x] **Step 1: Replace `Timestamp` with `Date` (or ISO `string`) across `types/*`**

In each file: remove `import { Timestamp } from "firebase/firestore";` and change every `Timestamp` field to `Date`. Specifically:
- `types/post.ts`: `createTime: Timestamp` → `createdAt: Date`; rename `imageURL`→`imageUrl`, `communityImageURL`→`communityImageUrl`, `creatorUsername` unchanged. `PostVote` unchanged (no Timestamp).
- `types/community.ts`: `createdAt?: Timestamp` → `createdAt: Date`; `imageURL`→`imageUrl`; drop `adminIds?` (replaced by `community_members.isModerator`); `CommunitySnippet.imageURL`→`imageUrl`, `isAdmin`→`isModerator`.
- `types/comment.ts`: `createdAt: Timestamp` → `createdAt: Date`.
- `types/communityMember.ts`: unchanged (no Timestamp) — but align `uid`→`id`, `displayName` stays.
- `types/savedPost.ts`: `communityImageURL`→`communityImageUrl`.

> **Executor note:** Field renames (`imageURL`→`imageUrl`, `createTime`→`createdAt`) ripple into components/hooks. Every subsequent task that touches a consumer must update references. The green gate `tsc --noEmit` is the safety net — it must be clean by Task 14.

- [x] **Step 2: Delete `types/authModal.ts`**

Run: `git rm types/authModal.ts`

- [x] **Step 3: Commit**

```bash
git add types/
git commit -m "refactor: types use Date instead of Firestore Timestamp; drop authModal type

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Rewrite data layer — posts & votes

**Files:**
- Modify: `lib/posts/getPosts.ts`, `getPost.ts`, `lib/post/getPost.ts`, `createPost.ts`, `deletePost.ts`, `getPostVotes.ts`, `getCommunityPostVotes.ts`, `handlePostVote.ts`, `getSavedPosts.ts`, `savePost.ts`, `unsavePost.ts`
- Test: `tests/lib/posts.test.ts`

Each function keeps its **exported name and call signature**; only the body changes from Firestore to Drizzle. `lastVisible` cursors change type from `QueryDocumentSnapshot` to `{ createdAt: Date; id: string } | null` (feeds) or `{ voteStatus: number; id: string } | null` (guest feed); callers pass the returned cursor back unchanged.

- [ ] **Step 1: Rewrite `lib/posts/getPosts.ts`**

```ts
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

export type PostCursor = { createdAt: Date; id: string } | { voteStatus: number; id: string } | null;

export const getPosts = async (
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: PostCursor,
) => {
  const where = [];
  if (communityId) where.push(eq(posts.communityId, communityId));
  else if (communityIds && communityIds.length > 0) where.push(inArray(posts.communityId, communityIds));

  const orderByVote = isGenericHome && !communityId && !(communityIds && communityIds.length);

  if (lastVisible) {
    if (orderByVote && "voteStatus" in lastVisible) {
      where.push(or(lt(posts.voteStatus, lastVisible.voteStatus),
        and(eq(posts.voteStatus, lastVisible.voteStatus), lt(posts.id, lastVisible.id))));
    } else if ("createdAt" in lastVisible) {
      where.push(or(lt(posts.createdAt, lastVisible.createdAt),
        and(eq(posts.createdAt, lastVisible.createdAt), lt(posts.id, lastVisible.id))));
    }
  }

  const rows = await db.select().from(posts)
    .where(where.length ? and(...where) : undefined)
    .orderBy(orderByVote ? desc(posts.voteStatus) : desc(posts.createdAt), desc(posts.id))
    .limit(10);

  const result = rows as unknown as Post[];
  const last = rows.length
    ? (orderByVote
        ? { voteStatus: rows[rows.length - 1].voteStatus, id: rows[rows.length - 1].id }
        : { createdAt: rows[rows.length - 1].createdAt, id: rows[rows.length - 1].id })
    : null;
  return { posts: result, newLastVisible: last };
};
```

- [ ] **Step 2: Rewrite `lib/posts/getPost.ts` and `lib/post/getPost.ts`**

Both fetch a single post by id. Body:
```ts
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { eq } from "drizzle-orm";

export const getPost = async (postId: string): Promise<Post | null> => {
  const row = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  return (row as unknown as Post) ?? null;
};
```
> Note: there are two duplicate `getPost.ts` files (`lib/post/` and `lib/posts/`). Keep both for now (callers import from each); make their bodies identical. Consolidation is out of scope (no unrelated refactor).

- [ ] **Step 3: Rewrite `lib/posts/createPost.ts`**

Signature changes: the old `user: FirebaseUser` becomes `author: { id: string; username: string }` (the local user id + display name resolved by the caller via `requireUser`). Image upload stays Firebase Storage for now (Phase B) — keep the existing `uploadString` block but guard import; if that creates a Firebase dependency we are removing in Task 1, instead **stub image upload**: accept `imageUrl?: string` already-uploaded and persist it. Final body:

```ts
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export const createPost = async (
  author: { id: string; username: string },
  communityId: string,
  communityImageUrl: string | undefined,
  postData: { title: string; body: string },
  imageUrl?: string,
) => {
  const id = randomUUID();
  await db.insert(posts).values({
    id,
    communityId,
    communityImageUrl: communityImageUrl ?? null,
    creatorId: author.id,
    creatorUsername: author.username,
    title: postData.title,
    body: postData.body,
    imageUrl: imageUrl ?? null,
    numberOfComments: 0,
    voteStatus: 0,
  });
  return id;
};
```
> **Decision locked:** Firebase Storage upload is Phase B. In Phase A `createPost`/profile/community image flows accept an already-resolved `imageUrl` string (or `undefined`); the actual upload pathway is rewired in Phase B. The image picker UI stays but its submit handler passes `undefined` until Phase B (documented in Task 13).

- [ ] **Step 4: Rewrite `lib/posts/deletePost.ts`**

```ts
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const deletePost = async (postId: string) => {
  // comments, post_votes, saved_posts cascade via FK ON DELETE CASCADE.
  await db.delete(posts).where(eq(posts.id, postId));
};
```

- [ ] **Step 5: Rewrite `getPostVotes.ts` / `getCommunityPostVotes.ts`**

```ts
// getPostVotes.ts — all of a user's votes
import { db } from "@/lib/db";
import { postVotes } from "@/lib/db/schema";
import { PostVote } from "@/types/post";
import { eq } from "drizzle-orm";

export const getPostVotes = async (userId: string): Promise<PostVote[]> =>
  (await db.select().from(postVotes).where(eq(postVotes.userId, userId))) as unknown as PostVote[];
```
```ts
// getCommunityPostVotes.ts — a user's votes within one community
import { db } from "@/lib/db";
import { postVotes } from "@/lib/db/schema";
import { PostVote } from "@/types/post";
import { and, eq } from "drizzle-orm";

export const getCommunityPostVotes = async (userId: string, communityId: string): Promise<PostVote[]> =>
  (await db.select().from(postVotes)
    .where(and(eq(postVotes.userId, userId), eq(postVotes.communityId, communityId)))) as unknown as PostVote[];
```

- [ ] **Step 6: Rewrite `handlePostVote.ts` (transactional)**

```ts
import { db } from "@/lib/db";
import { postVotes, posts } from "@/lib/db/schema";
import { Post, PostVote } from "@/types/post";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const handlePostVote = async (
  userId: string, post: Post, vote: number, communityId: string, existingVote?: PostVote,
) => {
  let voteChange = vote;
  let newVote: PostVote | undefined;
  let voteIdToDelete: string | undefined;

  await db.transaction(async (tx) => {
    if (!existingVote) {
      const id = randomUUID();
      await tx.insert(postVotes).values({ id, userId, postId: post.id!, communityId, voteValue: vote });
      newVote = { id, postId: post.id!, communityId, voteValue: vote };
      voteChange = vote;
    } else if (existingVote.voteValue === vote) {
      await tx.delete(postVotes).where(eq(postVotes.id, existingVote.id));
      voteChange = -vote;
      voteIdToDelete = existingVote.id;
    } else {
      await tx.update(postVotes).set({ voteValue: vote }).where(eq(postVotes.id, existingVote.id));
      voteChange = 2 * vote;
      newVote = { ...existingVote, voteValue: vote };
    }
    await tx.update(posts).set({ voteStatus: sql`${posts.voteStatus} + ${voteChange}` })
      .where(eq(posts.id, post.id!));
  });

  return { voteChange, newVote, voteIdToDelete };
};
```

- [ ] **Step 7: Rewrite `getSavedPosts.ts` / `savePost.ts` / `unsavePost.ts`**

```ts
// getSavedPosts.ts
import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";
import { SavedPost } from "@/types/savedPost";
import { eq } from "drizzle-orm";
export const getSavedPosts = async (userId: string): Promise<SavedPost[]> =>
  (await db.select().from(savedPosts).where(eq(savedPosts.userId, userId)))
    .map((r) => ({ id: r.postId, postId: r.postId, communityId: r.communityId, postTitle: r.postTitle, communityImageUrl: r.communityImageUrl ?? undefined }));
```
```ts
// savePost.ts
import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";
export const savePost = async (userId: string, p: { id: string; communityId: string; title: string; communityImageUrl?: string }) => {
  await db.insert(savedPosts).values({ userId, postId: p.id, communityId: p.communityId, postTitle: p.title, communityImageUrl: p.communityImageUrl ?? null })
    .onConflictDoNothing();
};
```
```ts
// unsavePost.ts
import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
export const unsavePost = async (userId: string, postId: string) => {
  await db.delete(savedPosts).where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
};
```
> **Executor note:** adjust `savePost`/`unsavePost` parameter shapes to match their current callers in `hooks/posts/useSavedPosts.tsx`; keep the *exported function name* identical and update the hook in Task 12 to pass the new shape.

- [ ] **Step 8: Write test `tests/lib/posts.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";

const select = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => select() }) }) }) }) },
}));
import { getPosts } from "@/lib/posts/getPosts";

describe("getPosts", () => {
  it("returns a keyset cursor from the last row", async () => {
    const d = new Date("2026-01-01");
    select.mockResolvedValueOnce([{ id: "p1", createdAt: d, voteStatus: 0 }]);
    const r = await getPosts("c1");
    expect(r.posts).toHaveLength(1);
    expect(r.newLastVisible).toEqual({ createdAt: d, id: "p1" });
  });
  it("returns null cursor on empty", async () => {
    select.mockResolvedValueOnce([]);
    const r = await getPosts("c1");
    expect(r.newLastVisible).toBeNull();
  });
});
```

- [ ] **Step 9: Run test**

Run: `pnpm test tests/lib/posts.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/posts lib/post tests/lib/posts.test.ts
git commit -m "refactor: posts/votes/saved data layer on Drizzle (transactional counters)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Rewrite data layer — communities, comments, search, profile

**Files (rewrite Firestore → Drizzle, keep names/signatures):**
- `lib/community/`: `createCommunity.ts`, `deleteCommunity.ts`, `getCommunities.ts`, `getCommunityData.ts`, `joinCommunity.ts`, `leaveCommunity.ts`, `communityPermissions.ts`, `fetchCommunityMembers.ts`, `fetchCommunityAdmins.ts`, `addCommunityAdmin.ts`, `removeCommunityAdmin.ts`, `removeCommunityMember.ts`, `findUserByEmail.ts`, `searchUsersByEmail.ts`, `updateCommunityPrivacy.ts`, `updateCommunityImage.ts`, `deleteCommunityImage.ts`
- `lib/comments/`: `createComment.ts`, `deleteComment.ts`, `getComments.ts`
- `lib/search/getSearchData.ts`
- `lib/user-profile/`: `updateUserCommentsName.ts`, `updateUserPostsName.ts`, `uploadProfileImage.ts`, `deleteProfileImage.ts`
- Test: `tests/lib/community.test.ts`, `tests/lib/comments.test.ts`

Apply these mappings (Firestore → Drizzle), each preserving the exported function name & signature:

- [ ] **Step 1: Communities**
  - `createCommunity(name, creatorId, privacyType)` → `db.transaction`: `insert(communities)` then `insert(communityMembers)` with `isModerator: true`; `numberOfMembers` default 1.
  - `getCommunities(...)` → `db.select().from(communities)` with keyset pagination on `createdAt,id` (same cursor pattern as `getPosts`).
  - `getCommunityData(id)` → `db.query.communities.findFirst({ where: eq(communities.id, id) })`.
  - `joinCommunity(userId, communityId, imageUrl?)` → tx: `insert(communityMembers).onConflictDoNothing()` + `update(communities) set numberOfMembers = numberOfMembers + 1`.
  - `leaveCommunity(userId, communityId)` → tx: `delete(communityMembers)` + `numberOfMembers - 1`.
  - `deleteCommunity(communityId)` → `db.delete(communities).where(eq(id))` (posts→comments→votes→saved cascade via FK; community_members cascade).
  - `communityPermissions(userId, communityId)` → query `communityMembers` row; return `{ isMember, isModerator }`.
  - `fetchCommunityMembers(communityId)` / `fetchCommunityAdmins` → join `communityMembers` × `users`; admins filter `isModerator = true`. Return `CommunityMember[]` (`{ id, email, displayName: name }`).
  - `addCommunityAdmin`/`removeCommunityAdmin(userId, communityId)` → `update(communityMembers).set({ isModerator: true|false })`.
  - `removeCommunityMember(userId, communityId)` → same as `leaveCommunity` body.
  - `findUserByEmail(email)` → `db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) })`.
  - `searchUsersByEmail(q)` → `db.select().from(users).where(ilike(users.email, \`%${q}%\`)).limit(10)`.
  - `updateCommunityPrivacy(communityId, privacyType)` → `update(communities).set({ privacyType })`.
  - `updateCommunityImage(communityId, imageUrl)` → `update(communities).set({ imageUrl })` (string already resolved; upload deferred to Phase B).
  - `deleteCommunityImage(communityId)` → `update(communities).set({ imageUrl: null })`.

- [ ] **Step 2: Comments**
  - `getComments(postId)` → `db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt))`.
  - `createComment(...)` → tx: `insert(comments)` (compute `depth = parent ? parent.depth+1 : 0`) + `update(posts) set numberOfComments = numberOfComments + 1`.
  - `deleteComment(commentId, postId)` → tx: count the comment plus its descendants (recursive: gather ids where `parentId` chains to `commentId`), `delete(comments)` (self-FK cascade handles children automatically — only need `delete(comments).where(eq(comments.id, commentId))`), then `update(posts) set numberOfComments = numberOfComments - <deletedCount>`. Compute `<deletedCount>` via a recursive CTE before deleting:
    ```ts
    const ids = await tx.execute(sql`
      WITH RECURSIVE t AS (
        SELECT id FROM comments WHERE id = ${commentId}
        UNION ALL SELECT c.id FROM comments c JOIN t ON c.parent_id = t.id
      ) SELECT count(*)::int AS n FROM t`);
    const n = (ids as unknown as { n: number }[])[0].n;
    await tx.delete(comments).where(eq(comments.id, commentId));
    await tx.update(posts).set({ numberOfComments: sql`${posts.numberOfComments} - ${n}` }).where(eq(posts.id, postId));
    ```

- [ ] **Step 3: Search** — `getSearchData(q)` → two queries: communities `ilike(communities.id, %q%)` limit 5; posts `ilike(posts.title, %q%)` order by `createdAt desc` limit 5; return the same `{ communities, posts }` shape the modal expects.

- [ ] **Step 4: Profile**
  - `updateUserCommentsName(userId, name)` → `update(comments).set({ creatorDisplayText: name }).where(eq(comments.creatorId, userId))`.
  - `updateUserPostsName(userId, name)` → `update(posts).set({ creatorUsername: name }).where(eq(posts.creatorId, userId))`.
  - `uploadProfileImage(userId, file)` → Phase A stub: `update(users).set({ imageUrl: <passed url> })`; real upload Phase B. Keep signature, accept a resolved URL string.
  - `deleteProfileImage(userId)` → `update(users).set({ imageUrl: null })`.

- [ ] **Step 5: Write `tests/lib/comments.test.ts`** (representative — recursive delete count)

```ts
import { describe, it, expect, vi } from "vitest";
const execute = vi.fn(); const del = vi.fn(); const upd = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { transaction: async (f: any) => f({
    execute, delete: () => ({ where: del }),
    update: () => ({ set: () => ({ where: upd }) }),
  }) },
}));
import { deleteComment } from "@/lib/comments/deleteComment";
it("decrements numberOfComments by descendant count", async () => {
  execute.mockResolvedValueOnce([{ n: 3 }]);
  await deleteComment("c1", "p1");
  expect(del).toHaveBeenCalled();
  expect(upd).toHaveBeenCalled();
});
```

- [ ] **Step 6: Write `tests/lib/community.test.ts`** (representative — join increments count)

```ts
import { describe, it, expect, vi } from "vitest";
const insert = vi.fn(() => ({ values: () => ({ onConflictDoNothing: () => Promise.resolve() }) }));
const update = vi.fn(() => ({ set: () => ({ where: () => Promise.resolve() }) }));
vi.mock("@/lib/db", () => ({ db: { transaction: async (f: any) => f({ insert, update }) } }));
import { joinCommunity } from "@/lib/community/joinCommunity";
it("inserts membership and bumps member count", async () => {
  await joinCommunity("u1", "c1");
  expect(insert).toHaveBeenCalled();
  expect(update).toHaveBeenCalled();
});
```

- [ ] **Step 7: Run tests**

Run: `pnpm test tests/lib/community.test.ts tests/lib/comments.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/community lib/comments lib/search lib/user-profile tests/lib/community.test.ts tests/lib/comments.test.ts
git commit -m "refactor: communities/comments/search/profile data layer on Drizzle

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Rewrite auth-consuming hooks

**Files:**
- Modify: every hook importing `react-firebase-hooks`, `@/firebase/clientApp`, or `firebase/*`. Confirm the full list with:
  `grep -rl "react-firebase-hooks\|@/firebase/clientApp\|firebase/" hooks/`
  Known: `hooks/useUserProfile.ts`, `hooks/posts/*`, `hooks/comments/*`, `hooks/community/*`, `hooks/admin/*`, `hooks/useSearch.tsx`, `hooks/useDirectory.tsx`, `components/layout/GlobalHooks.tsx`.

- [ ] **Step 1: Replace the auth-state primitive**

Anywhere a hook does `const [user] = useAuthState(auth)` (from `react-firebase-hooks`), replace with:
```ts
import { useSession } from "@/lib/auth-client";
// ...
const { data: session } = useSession();
const user = session?.user ?? null; // { id, email, name, image }
```
References to `user.uid` → `user.id`; `user.displayName` → `user.name`; `user.photoURL` → `user.image`. The local forum user id (for FK writes) comes from a server boundary, not the client session — see Step 2.

- [ ] **Step 2: Route writes through server actions/route handlers that call `requireUser()`**

Hooks that previously called a `lib/*` write with `user.uid` must now obtain the **local** user id. Pattern: create thin server actions in `app/actions/*.ts` (`"use server"`) that call `requireUser()` then the `lib/*` function with `userId`. Hooks call the action instead of the lib function directly. Example for vote:
```ts
// app/actions/vote.ts
"use server";
import { requireUser } from "@/lib/auth/session";
import { handlePostVote } from "@/lib/posts/handlePostVote";
import type { Post, PostVote } from "@/types/post";
export async function voteAction(post: Post, vote: number, communityId: string, existing?: PostVote) {
  const { userId } = await requireUser();
  return handlePostVote(userId, post, vote, communityId, existing);
}
```
Apply the same wrapper pattern for: create/delete post, save/unsave, create/delete comment, create community, join/leave, admin add/remove, remove member, profile name/image. Hooks import the action; remove direct `lib/*` write imports from client hooks. `lib/*` read functions may stay called from server components or server actions.

- [ ] **Step 3: `useUserProfile.ts`** — drop `useUpdateProfile`/`useAuthState`; `updateName` calls a `profileNameAction` (server) that runs `updateUserCommentsName`+`updateUserPostsName`+`update(users)`; `updateImage`/`removeImage` call profile-image actions (Phase A: image upload deferred — `updateImage` accepts no file effect yet, or no-ops with a toast "image upload coming soon"; keep the function exported so callers compile). Replace `setPostStateValue` Jotai sync as-is (still valid).

- [ ] **Step 4: `components/layout/GlobalHooks.tsx`** — replace any Firebase auth listener with `useSession()`; remove `auth` import.

- [ ] **Step 5: Typecheck the hooks dir**

Run: `pnpm exec tsc --noEmit`
Expected: no remaining errors in `hooks/` or `app/actions/`. (Component errors handled in Task 13.)

- [ ] **Step 6: Commit**

```bash
git add hooks app/actions components/layout/GlobalHooks.tsx
git commit -m "refactor: hooks use Better Auth session + server-action write boundary

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 13: Remove auth UI; rewire auth-consuming components

**Files:**
- Delete: `components/modal/auth/` (whole dir incl. `oauth-buttons/`), `atoms/authModalAtom.ts`, `schema/auth.ts`
- Modify: `components/navbar/right-content/RightContent.tsx`, `AuthButtons.tsx`, `LogOutButton.tsx`, `components/navbar/right-content/user-menu/*`, `app/providers.tsx`, any component importing `firebase/auth` `User` type or `authModalAtom`

- [ ] **Step 1: Delete auth UI + atom + schema**

Run:
```bash
git rm -r components/modal/auth atoms/authModalAtom.ts schema/auth.ts
```

- [ ] **Step 2: `AuthButtons.tsx` — link to central login**

Replace the buttons that opened `authModalAtom` with anchors:
```tsx
// "Log In" / "Sign Up" both go to the central app
<a href="/api/auth/start"><Button variant="outline">Log In</Button></a>
<a href="/api/auth/start"><Button>Sign Up</Button></a>
```
(Chakra `Button` stays — UI lib swap is Phase D.)

- [ ] **Step 3: `LogOutButton.tsx`** — replace Firebase `signOut(auth)` with a link/handler to `/api/auth/signout` (or `authClient.signOut()` from `@/lib/auth-client` then `router.refresh()`).

- [ ] **Step 4: `RightContent.tsx`** — remove `<AuthModal />` import/render and the `firebase/auth` `User` type. Change the `user` prop type to the session user shape: `type SessionUser = { id: string; email: string; name?: string | null; image?: string | null }`. Branch on `user` from `useSession()` via the parent (Navbar) instead of a passed Firebase user.

- [ ] **Step 5: Sweep remaining `firebase` imports**

Run: `grep -rl "firebase" --include=*.ts --include=*.tsx app components hooks lib atoms schema types`
Expected after fixes: only Phase-B-deferred Storage references, if any, remain — and there should be **none** because image upload was stubbed in Tasks 10–12. The grep must return empty. Fix any stragglers (replace `User` from `firebase/auth` with the `SessionUser` type; remove dead imports).

- [ ] **Step 6: `app/providers.tsx`** — no Firebase here; leave Jotai/Chakra as-is (Phase C/D). Confirm it still compiles.

- [ ] **Step 7: Green gate**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS, zero `firebase` imports remaining.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: remove forum auth UI; log in/out delegate to central app

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 14: Full green gate, README, env, final verification

**Files:**
- Modify: `README.md`, `.env`, `vitest.setup.ts` (if env loading needed)

- [ ] **Step 1: Vitest env** — if any test needs env vars, ensure `vitest.setup.ts` loads `.env` via `process.loadEnvFile?.()` (per memory `reference_vitest_env_loading`: vitest does not auto-load `.env`; do not `import { loadEnv } from "vite"`).

- [ ] **Step 2: Update `README.md`** — replace the Firebase "Requirements"/"Stack"/setup sections with: Postgres (Neon) + Drizzle, Better Auth sibling of `login.projectconfucius.id` (no local signup), pnpm, env vars from `.env.example`, `pnpm db:generate`/`db:migrate`. Remove the Firestore index table and `firebase init`/`firebase deploy` steps.

- [ ] **Step 3: Full green gate**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all PASS. `pnpm build` must succeed with zero `firebase` modules in the graph.

- [ ] **Step 4: Manual smoke (ask the user)**

Provide the user these manual checks (requires central auth running / a valid `.projectconfucius.id` session and a dev Neon DB migrated):
  1. Visit forum unauthenticated → `/community/x/submit` redirects to `login.projectconfucius.id/sign-in`.
  2. With a valid shared session cookie, load the home feed (guest vote-ranked path works even without provisioning).
  3. Authenticated: create a community, post, comment, vote, save — verify rows land in Postgres and counters update.

- [ ] **Step 5: Commit + finish**

```bash
git add README.md .env.example vitest.setup.ts
git commit -m "docs: README/env for Postgres + sibling auth; Phase A complete

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Then invoke **superpowers:finishing-a-development-branch** to choose merge/PR/cleanup.

---

## Self-review (author)

- **Spec coverage:** §2 architecture → Tasks 2/4/5/7; §3 schema → Task 2/3; §4 sibling auth + deletions → Tasks 5/6/7/13; §5 data layer → Tasks 9/10/11/12; §6 cross-repo → Task 8; §7 packages/tooling/green gate → Tasks 1/14. All spec sections mapped.
- **Placeholder scan:** no TBD/TODO; image-upload deferral is an explicit, documented decision (Phase B), not a placeholder — the stub behavior is specified.
- **Type consistency:** `provisionLocalUser` returns `{ id }` (Task 6) and is consumed as `local.id` (Task 7). `PostCursor` defined in Task 10 Step 1 and reused by callers. `SessionUser` shape defined Task 13 Step 4, referenced Steps 4–5. Field renames (`imageURL`→`imageUrl`, `createTime`→`createdAt`) introduced Task 9 with an explicit ripple note; green gate enforces consistency by Task 14.
- **Scope:** Phase A only; Storage/State/UI explicitly deferred with documented stubs so the app compiles and Firebase is fully removed except Storage (which is also stubbed out, so the `firebase` package is removed in Task 1 — verified by the Task 13 Step 5 / Task 14 Step 3 grep+build gate).
