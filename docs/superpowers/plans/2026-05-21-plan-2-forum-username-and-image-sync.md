# Plan 2 — Forum Username & Image Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror the Better Auth user's `username` and `image` into the forum's local `users` row, write real usernames into the `posts.creatorUsername` / `comments.creatorDisplayText` display caches at creation time (set-at-write, never rewritten), and push forum-side profile image edits back to the auth user via the auth-side `PATCH /api/user/image` endpoint.

**Architecture:** Three flows — (a) pull on `provisionLocalUser` (username always, image only when local empty), (b) push from the two forum image write sites to auth, (c) freeze the display-cache fanout (delete the post/comment name rewriters; renames no longer ripple). Single helper `formatUserHandle(username)` is the only place that decides how `u/<name>` is rendered.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (Postgres), Better Auth 1.6.11, vitest + happy-dom, R2 storage.

**Spec:** `docs/superpowers/specs/2026-05-21-forum-username-and-image-sync-design.md`.

**Hard prerequisite:** Auth-side Plan 1 must be deployed first so `session.user.username` is on the session payload and `PATCH /api/user/image` exists with the forum origin in its CORS allowlist. If auth Plan 1 is not yet live in the env you're running against, push calls log errors but everything else works.

**Critical: the user runs all destructive DB commands.** Drizzle generate + `db:push` and the manual `ALTER TABLE ... DROP NOT NULL` + `UPDATE ... SET ... = NULL` statements are run by the human, not by you. The Task that needs them stops to ask.

---

### Pre-flight: branch

- [x] **Step 1: Create the feature branch**

```bash
cd c:/Users/sinta/projects/projectconfucius-forum
git checkout main
git pull
git checkout -b feat/plan-2-forum-username-image-sync
```

- [x] **Step 2: Confirm green baseline before touching anything**

```bash
pnpm test
pnpm typecheck
pnpm eslint
```

Expected: all green. If any fail on `main`, stop and tell the user — a red baseline isn't this plan's job to fix.

---

### Task 1: Schema — add username, drop NOT NULL on display caches

**Files:**
- Modify: `lib/db/schema.ts`

- [x] **Step 1: Edit `lib/db/schema.ts`**

Add `username` to the `users` table and drop `.notNull()` on `posts.creatorUsername` and `comments.creatorDisplayText`. After edits the relevant lines look like:

```ts
export const users = pgTable("users", {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    username: text("username").unique(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// in posts:
creatorUsername: text("creator_username"),

// in comments:
creatorDisplayText: text("creator_display_text"),
```

- [x] **Step 2: Ask the user to generate + apply migrations**

Stop and message the user:

> "Schema changes are staged in `lib/db/schema.ts`. Please run:
> 1. `pnpm db:generate` (creates the Drizzle migration)
> 2. `pnpm db:push` OR run the generated migration against your dev DB
> 3. Then the destructive null-out:
>    ```sql
>    UPDATE posts SET creator_username = NULL;
>    UPDATE comments SET creator_display_text = NULL;
>    ```
> Take a DB backup first. Tell me when this is done."

Wait for the user. Do not proceed.

- [x] **Step 3: After user confirms, verify locally**

```bash
pnpm db:studio   # optional, eyeball it
pnpm typecheck   # schema types must compile
```

Expected: typecheck passes; if it fails because downstream code references `creatorUsername` as `string` (not `string | null`), that's fine — Task 6/7 fixes those.

- [x] **Step 4: Commit the schema change**

```bash
git add lib/db/schema.ts drizzle/   # adjust path if generated migrations land elsewhere
git commit -m "feat: add users.username; nullable post/comment display caches (Plan 2)"
```

---

### Task 2: `formatUserHandle` helper

**Files:**
- Create: `lib/user-profile/formatUserHandle.ts`
- Create: `__tests__/lib/user-profile/formatUserHandle.test.ts`

- [x] **Step 1: Write the failing test**

Create `__tests__/lib/user-profile/formatUserHandle.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";

describe("formatUserHandle", () => {
    it("returns u/<name> for a real username", () => {
        expect(formatUserHandle("alice")).toBe("u/alice");
    });

    it("returns u/deleted when username is null", () => {
        expect(formatUserHandle(null)).toBe("u/deleted");
    });

    it("returns u/deleted when username is undefined", () => {
        expect(formatUserHandle(undefined)).toBe("u/deleted");
    });
});
```

- [x] **Step 2: Run the test and verify it fails**

```bash
pnpm test __tests__/lib/user-profile/formatUserHandle.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Create the helper**

Create `lib/user-profile/formatUserHandle.ts`:

```ts
export function formatUserHandle(username: string | null | undefined): string {
    return `u/${username ?? "deleted"}`;
}
```

- [x] **Step 4: Run the test and verify it passes**

```bash
pnpm test __tests__/lib/user-profile/formatUserHandle.test.ts
```

Expected: 3 passed.

- [x] **Step 5: Commit**

```bash
git add lib/user-profile/formatUserHandle.ts __tests__/lib/user-profile/formatUserHandle.test.ts
git commit -m "feat: add formatUserHandle helper (Plan 2)"
```

---

### Task 3: Extend `provisionLocalUser` to sync username + image

**Files:**
- Modify: `lib/auth/provision.ts`
- Modify: `__tests__/auth/provision.test.ts`

- [x] **Step 1: Extend the failing tests**

Replace the body of `__tests__/auth/provision.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirst, insert, update } = vi.hoisted(() => ({
    findFirst: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
}));

const updateSet = vi.fn();
const updateWhere = vi.fn();

vi.mock("@/lib/db", () => ({
    db: {
        query: { users: { findFirst } },
        insert: () => ({ values: insert }),
        update: () => ({
            set: (patch: unknown) => {
                updateSet(patch);
                return { where: () => ({ returning: update }) };
            },
        }),
    },
}));

import { provisionLocalUser } from "@/lib/auth/provision";

beforeEach(() => {
    findFirst.mockReset();
    insert.mockReset();
    update.mockReset();
    updateSet.mockReset();
    updateWhere.mockReset();
});

const baseInput = {
    authUserId: "a1",
    email: "x@x.com",
    name: "X",
    username: "alice",
    image: "https://cdn/x.png",
};

describe("provisionLocalUser", () => {
    it("inserts all five fields when no row exists", async () => {
        findFirst.mockResolvedValueOnce(undefined); // by authUserId
        findFirst.mockResolvedValueOnce(undefined); // by email
        insert.mockReturnValueOnce({ returning: () => Promise.resolve([{ id: "u-new" }]) });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u-new");
        const inserted = insert.mock.calls[0][0];
        expect(inserted).toMatchObject({
            authUserId: "a1",
            email: "x@x.com",
            name: "X",
            username: "alice",
            imageUrl: "https://cdn/x.png",
        });
    });

    it("relinks by email and updates username + image + name", async () => {
        findFirst.mockResolvedValueOnce(undefined);                               // by authUserId
        findFirst.mockResolvedValueOnce({ id: "u-existing", imageUrl: null });    // by email
        update.mockResolvedValueOnce([{ id: "u-existing" }]);
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u-existing");
        expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
            authUserId: "a1",
            username: "alice",
            name: "X",
            imageUrl: "https://cdn/x.png",
        }));
    });

    it("on authUserId hit: drift-corrects username; sets image only when local is null", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "old", imageUrl: null });
        update.mockResolvedValueOnce([{ id: "u1" }]);
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
            username: "alice",
            imageUrl: "https://cdn/x.png",
        }));
    });

    it("on authUserId hit: does NOT clobber existing local image", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "alice", imageUrl: "https://forum/x.png" });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        // username matched + image already present → no update at all
        expect(updateSet).not.toHaveBeenCalled();
    });

    it("on authUserId hit: skips update when nothing drifted", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "alice", imageUrl: "https://forum/x.png" });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        expect(updateSet).not.toHaveBeenCalled();
    });

    it("accepts null username and null image", async () => {
        findFirst.mockResolvedValueOnce(undefined);
        findFirst.mockResolvedValueOnce(undefined);
        insert.mockReturnValueOnce({ returning: () => Promise.resolve([{ id: "u-new" }]) });
        const r = await provisionLocalUser({ ...baseInput, username: null, image: null });
        expect(r.id).toBe("u-new");
        const inserted = insert.mock.calls[0][0];
        expect(inserted).toMatchObject({ username: null, imageUrl: null });
    });
});
```

- [x] **Step 2: Run tests, verify failure**

```bash
pnpm test __tests__/auth/provision.test.ts
```

Expected: FAIL (current `provisionLocalUser` rejects `username`/`image` typed args; doesn't write the new fields).

- [x] **Step 3: Update `lib/auth/provision.ts`**

Replace the file with:

```ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Find-or-relink-or-create the local users row for a Better Auth identity.
 * Syncs username (drift-corrected) and image (only when local is null) from the
 * auth session. See spec §Provisioning.
 */
export async function provisionLocalUser(input: {
    authUserId: string;
    email: string;
    name: string;
    username: string | null;
    image: string | null;
}): Promise<{ id: string }> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email;

    const byAuth = await db.query.users.findFirst({
        where: eq(users.authUserId, input.authUserId),
        columns: { id: true, username: true, imageUrl: true },
    });
    if (byAuth) {
        const patch: Record<string, unknown> = {};
        if (byAuth.username !== input.username) patch.username = input.username;
        if (byAuth.imageUrl == null && input.image != null) patch.imageUrl = input.image;
        if (Object.keys(patch).length > 0) {
            patch.updatedAt = new Date();
            await db.update(users).set(patch).where(eq(users.id, byAuth.id)).returning({ id: users.id });
        }
        return { id: byAuth.id };
    }

    const byEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, imageUrl: true },
    });
    if (byEmail) {
        const [row] = await db.update(users)
            .set({
                authUserId: input.authUserId,
                name,
                username: input.username,
                imageUrl: input.image,
                updatedAt: new Date(),
            })
            .where(eq(users.id, byEmail.id))
            .returning({ id: users.id });
        return { id: row.id };
    }

    const [row] = await db.insert(users)
        .values({
            id: randomUUID(),
            authUserId: input.authUserId,
            email,
            name,
            username: input.username,
            imageUrl: input.image,
        })
        .returning({ id: users.id });
    return { id: row.id };
}
```

- [x] **Step 4: Run tests, verify pass**

```bash
pnpm test __tests__/auth/provision.test.ts
```

Expected: 6 passed.

- [x] **Step 5: Commit**

```bash
git add lib/auth/provision.ts __tests__/auth/provision.test.ts
git commit -m "feat: provisionLocalUser syncs username + image from auth session (Plan 2)"
```

---

### Task 4: Propagate username + image through `requireUser` and the upload-confirm route

**Files:**
- Modify: `lib/auth/session.ts`
- Modify: `app/api/upload/profile-image/confirm/route.ts`

- [x] **Step 1: Edit `lib/auth/session.ts`**

```ts
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";

export const getAppSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

export const requireUser = cache(async () => {
    const session = await getAppSession();
    if (!session?.user) redirect("/api/auth/start");
    const u = session.user as typeof session.user & { username?: string | null; image?: string | null };
    const local = await provisionLocalUser({
        authUserId: u.id,
        email: u.email,
        name: u.name ?? u.email,
        username: u.username ?? null,
        image: u.image ?? null,
    });
    return { session, userId: local.id };
});
```

> If Better Auth's typed `session.user` already exposes `username` and `image`, drop the `as` cast and reference them directly. Check with `pnpm typecheck` after editing — adjust if needed.

- [x] **Step 2: Edit `app/api/upload/profile-image/confirm/route.ts` provision call**

Replace lines 19-23 (the existing `provisionLocalUser({...})` call) with:

```ts
const u = session.user as typeof session.user & { username?: string | null; image?: string | null };
const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    username: u.username ?? null,
    image: u.image ?? null,
});
```

- [x] **Step 3: Run typecheck + relevant tests**

```bash
pnpm typecheck
pnpm test __tests__/auth __tests__/api/upload-confirm.test.ts
```

Expected: typecheck passes; upload-confirm tests still pass (the mock in that test ignores extra args). If a test fails because the mock asserts the exact provision input, update the mock to include the new fields.

- [x] **Step 4: Commit**

```bash
git add lib/auth/session.ts app/api/upload/profile-image/confirm/route.ts
git commit -m "feat: forward session username + image into provisioning (Plan 2)"
```

---

### Task 5: `createPost` + `createPostAction` write real username

**Files:**
- Modify: `types/post.ts`
- Modify: `lib/posts/createPost.ts`
- Modify: `app/actions/posts.ts`
- Modify: `__tests__/lib/posts.test.ts`

- [x] **Step 1: Edit `types/post.ts`**

Find `creatorUsername: string;` and change to:

```ts
creatorUsername: string | null;
```

- [x] **Step 2: Update the failing post tests**

Open `__tests__/lib/posts.test.ts`. For any test that calls `createPost(...)`, update the `author` arg from `{ id, displayName: "..." }` (or however it's shaped) to:

```ts
{ id: "u1", username: "alice" }
```

Add a new test asserting null is passed through:

```ts
it("writes null creatorUsername when username is null", async () => {
    // arrange mocks as existing tests do
    await createPost({ id: "u1", username: null }, "c1", undefined, { title: "t", body: "b" });
    expect(insertedRow).toMatchObject({ creatorUsername: null });
});
```

> If the existing test file shape diverges, follow its style — the key assertion is that `createPost`'s `author.username` is written to `creatorUsername` verbatim.

- [x] **Step 3: Run tests, verify failure**

```bash
pnpm test __tests__/lib/posts.test.ts
```

Expected: FAIL — `createPost` still expects `author.username` but signature is the old `{ id, username: string }`.

- [x] **Step 4: Edit `lib/posts/createPost.ts`**

Change the signature:

```ts
export const createPost = async (
  author: { id: string; username: string | null },
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

- [ ] **Step 5: Edit `app/actions/posts.ts`**

Delete the `displayName()` helper at the top of the file. Update `createPostAction`:

```ts
export async function createPostAction(
  communityId: string,
  communityImageUrl: string | undefined,
  postData: { title: string; body: string },
  imageUrl?: string
) {
  const { session, userId } = await requireUser();
  const u = session.user as typeof session.user & { username?: string | null };
  return createPost(
    { id: userId, username: u.username ?? null },
    communityId,
    communityImageUrl,
    postData,
    imageUrl
  );
}
```

- [x] **Step 6: Run tests, verify pass**

```bash
pnpm test __tests__/lib/posts.test.ts
pnpm typecheck
```

Expected: posts tests pass; typecheck passes.

- [x] **Step 7: Commit**

```bash
git add types/post.ts lib/posts/createPost.ts app/actions/posts.ts __tests__/lib/posts.test.ts
git commit -m "feat: createPost writes real username (Plan 2)"
```

---

### Task 6: `createComment` + `createCommentAction` write real username

**Files:**
- Modify: `types/comment.ts`
- Modify: `lib/comments/createComment.ts`
- Modify: `app/actions/comments.ts`
- Modify: `__tests__/lib/comments.test.ts`
- Modify: `__tests__/lib/queries/comments/use-create-comment-mutation.test.tsx`

- [x] **Step 1: Edit `types/comment.ts`**

Find `creatorDisplayText: string;` and change to:

```ts
creatorDisplayText: string | null;
```

- [x] **Step 2: Update the failing comment tests**

In `__tests__/lib/comments.test.ts`, any call shaped `createComment({ id, displayName: "..." }, ...)` becomes:

```ts
createComment({ id: "u1", username: "alice" }, ...)
```

Add a null case asserting the insert receives null:

```ts
it("writes null creatorDisplayText when username is null", async () => {
    await createComment({ id: "u1", username: null }, "c1", "p1", "title", "body");
    expect(insertedRow).toMatchObject({ creatorDisplayText: null });
});
```

In `__tests__/lib/queries/comments/use-create-comment-mutation.test.tsx`, find the fixture `creatorDisplayText: "u"` (line 13). It already matches `string | null`; no change needed unless TS complains.

- [x] **Step 3: Run tests, verify failure**

```bash
pnpm test __tests__/lib/comments.test.ts
```

Expected: FAIL — signature mismatch.

- [x] **Step 4: Edit `lib/comments/createComment.ts`**

Rename the param and update the inserts:

```ts
export const createComment = async (
  author: { id: string; username: string | null },
  communityId: string,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
): Promise<Comment> => {
  let depth = 0;
  if (parentId) {
    const parent = await db.query.comments.findFirst({
      where: eq(comments.id, parentId),
      columns: { depth: true },
    });
    depth = (parent?.depth ?? 0) + 1;
  }

  if (depth > 2) {
    throw new Error(
      "Maximum comment depth reached. You cannot reply to this comment."
    );
  }

  const id = randomUUID();
  const createdAt = new Date();
  const newComment: Comment = {
    id,
    creatorId: author.id,
    creatorDisplayText: author.username,
    communityId,
    postId,
    postTitle,
    text: commentText,
    createdAt,
    depth,
    ...(parentId ? { parentId } : {}),
  };

  await db.transaction(async (tx) => {
    await tx.insert(comments).values({
      id,
      postId,
      parentId: parentId ?? null,
      communityId,
      postTitle,
      creatorId: author.id,
      creatorDisplayText: author.username,
      text: commentText,
      depth,
    });

    await tx
      .update(posts)
      .set({ numberOfComments: sql`${posts.numberOfComments} + 1` })
      .where(eq(posts.id, postId));
  });

  return newComment;
};
```

> Update the JSDoc `@param author` accordingly.

- [x] **Step 5: Edit `app/actions/comments.ts`**

Delete the `displayName()` helper. Update `createCommentAction`:

```ts
export async function createCommentAction(
  communityId: string,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
): Promise<Comment> {
  const { session, userId } = await requireUser();
  const u = session.user as typeof session.user & { username?: string | null };
  return createComment(
    { id: userId, username: u.username ?? null },
    communityId,
    postId,
    postTitle,
    commentText,
    parentId
  );
}
```

- [x] **Step 6: Run tests, verify pass**

```bash
pnpm test __tests__/lib/comments.test.ts __tests__/lib/queries/comments
pnpm typecheck
```

Expected: pass.

- [x] **Step 7: Commit**

```bash
git add types/comment.ts lib/comments/createComment.ts app/actions/comments.ts __tests__/lib/comments.test.ts __tests__/lib/queries/comments/use-create-comment-mutation.test.tsx
git commit -m "feat: createComment writes real username (Plan 2)"
```

---

### Task 7: UI read sites switch to `formatUserHandle`

**Files:**
- Modify: `components/posts/post-item/PostDetails.tsx`
- Modify: `components/navbar/SearchModal.tsx`
- Modify: `components/posts/comments/CommentItem.tsx`

- [x] **Step 1: Edit `components/posts/post-item/PostDetails.tsx`**

Add at the top of the imports:

```ts
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";
```

Replace line ~22:

```ts
const topText: string = `By ${formatUserHandle(post.creatorUsername)} ${moment(...)}`;
```

- [x] **Step 2: Edit `components/navbar/SearchModal.tsx`**

Add import:

```ts
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";
```

Replace line ~198 (where `{item.creatorUsername}` is rendered):

```tsx
{formatUserHandle(item.creatorUsername)}{" "}
```

- [x] **Step 3: Edit `components/posts/comments/CommentItem.tsx`**

Add import:

```ts
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";
```

Replace line ~84:

```tsx
<Text fontWeight={700}>{formatUserHandle(comment.creatorDisplayText)}</Text>
```

- [x] **Step 4: Run typecheck + tests**

```bash
pnpm typecheck
pnpm test
```

Expected: pass. If render-snapshot tests for these components exist and break because the displayed text changed, update the snapshots after eyeballing the new value (`u/alice` vs the old name).

- [ ] **Step 5: Commit**

```bash
git add components/posts/post-item/PostDetails.tsx components/navbar/SearchModal.tsx components/posts/comments/CommentItem.tsx
git commit -m "feat: UI renders u/<username> via formatUserHandle (Plan 2)"
```

---

### Task 8: Delete name-fanout rewriters; `profileNameAction` stops calling them

**Files:**
- Delete: `lib/user-profile/updateUserPostsName.ts`
- Delete: `lib/user-profile/updateUserCommentsName.ts`
- Modify: `app/actions/profile.ts`

- [x] **Step 1: Check for stragglers**

```bash
git grep -nE "updateUserPostsName|updateUserCommentsName"
```

Expected callers: only `app/actions/profile.ts`. If there are others, list them and stop — design assumed two callers only.

- [x] **Step 2: Edit `app/actions/profile.ts`**

Remove the two imports and the two calls inside `profileNameAction`. After the edit the action looks like:

```ts
"use server";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteProfileImage } from "@/lib/user-profile/deleteProfileImage";

export async function profileNameAction(name: string) {
  const { userId } = await requireUser();
  const trimmed = name.trim();
  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { userId };
}

export async function removeProfileImageAction() {
  const { userId } = await requireUser();
  return deleteProfileImage(userId);
}
```

> `removeProfileImageAction` will be extended in Task 10. Leave it as-is here.

- [x] **Step 3: Delete the two rewriter files**

```bash
git rm lib/user-profile/updateUserPostsName.ts lib/user-profile/updateUserCommentsName.ts
```

- [x] **Step 4: Run all tests + typecheck**

```bash
pnpm test
pnpm typecheck
```

Expected: pass. If any test imports the deleted modules, delete or update those tests — they're asserting behavior we've deliberately removed.

- [x] **Step 5: Commit**

```bash
git add app/actions/profile.ts
git commit -m "refactor: drop name-fanout rewriters; renames no longer touch caches (Plan 2)"
```

---

### Task 9: `patchAuthUserImage` helper

**Files:**
- Create: `lib/auth/patchAuthUserImage.ts`
- Create: `__tests__/auth/patchAuthUserImage.test.ts`

- [x] **Step 1: Write the failing test**

Create `__tests__/auth/patchAuthUserImage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://auth.test");
});

import { patchAuthUserImage } from "@/lib/auth/patchAuthUserImage";

describe("patchAuthUserImage", () => {
    it("PATCHes the auth user image endpoint with forwarded cookie", async () => {
        fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
        const headers = new Headers({ cookie: "better-auth.session_token=abc" });
        await patchAuthUserImage(headers, "https://cdn/x.png");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://auth.test/api/user/image");
        expect(init.method).toBe("PATCH");
        expect((init.headers as Record<string, string>).cookie).toBe("better-auth.session_token=abc");
        expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ image: "https://cdn/x.png" }));
    });

    it("forwards null image (clearing)", async () => {
        fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
        await patchAuthUserImage(new Headers(), null);
        const [, init] = fetchMock.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ image: null }));
    });

    it("does not throw on non-2xx", async () => {
        fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
        await expect(patchAuthUserImage(new Headers(), "x")).resolves.toBeUndefined();
    });

    it("does not throw when fetch rejects", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network"));
        await expect(patchAuthUserImage(new Headers(), "x")).resolves.toBeUndefined();
    });
});
```

- [x] **Step 2: Run the test, verify failure**

```bash
pnpm test __tests__/auth/patchAuthUserImage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

`lib/auth/patchAuthUserImage.ts`:

```ts
export async function patchAuthUserImage(
    reqHeaders: Headers,
    image: string | null,
): Promise<void> {
    const cookie = reqHeaders.get("cookie") ?? "";
    const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (!base) {
        console.error("[patchAuthUserImage] NEXT_PUBLIC_BETTER_AUTH_URL not set");
        return;
    }
    const url = `${base}/api/user/image`;
    try {
        const res = await fetch(url, {
            method: "PATCH",
            headers: { cookie, "content-type": "application/json" },
            body: JSON.stringify({ image }),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("[patchAuthUserImage] non-2xx", res.status, body);
        }
    } catch (err) {
        console.error("[patchAuthUserImage] fetch failed", err);
    }
}
```

- [ ] **Step 4: Run the test, verify pass**

```bash
pnpm test __tests__/auth/patchAuthUserImage.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/patchAuthUserImage.ts __tests__/auth/patchAuthUserImage.test.ts
git commit -m "feat: patchAuthUserImage helper (Plan 2)"
```

---

### Task 10: Wire `patchAuthUserImage` into both image write sites

**Files:**
- Modify: `app/api/upload/profile-image/confirm/route.ts`
- Modify: `app/actions/profile.ts`
- Modify: `__tests__/api/upload-confirm.test.ts`

- [ ] **Step 1: Update upload-confirm test**

Open `__tests__/api/upload-confirm.test.ts`. Add a mock for `patchAuthUserImage` and an assertion:

```ts
const patchAuthUserImage = vi.fn();
vi.mock("@/lib/auth/patchAuthUserImage", () => ({ patchAuthUserImage }));

beforeEach(() => {
    // ...existing resets...
    patchAuthUserImage.mockReset();
});

// In the success-path test for profile-image/confirm, after the existing
// expectations:
it("PATCHes auth user image after successful confirm", async () => {
    // arrange the same as the existing success test
    // ...
    expect(patchAuthUserImage).toHaveBeenCalledTimes(1);
    const [, image] = patchAuthUserImage.mock.calls[0];
    expect(image).toMatch(/^https:\/\//);  // newUrl
});
```

> If the existing test file is structured per-route (post-image, community-image, profile-image), add the new test under the profile-image describe block; if the profile-image describe block doesn't exist yet, copy the post-image one and adapt.

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test __tests__/api/upload-confirm.test.ts
```

Expected: FAIL — `patchAuthUserImage` not called.

- [ ] **Step 3: Edit `app/api/upload/profile-image/confirm/route.ts`**

Add import:

```ts
import { patchAuthUserImage } from "@/lib/auth/patchAuthUserImage";
```

After the existing `await db.update(users).set({ imageUrl: newUrl, ... })` line, add:

```ts
await patchAuthUserImage(req.headers, newUrl);
```

(Place it BEFORE the `oldKey` cleanup so a failure during cleanup doesn't block the auth push.)

- [ ] **Step 4: Edit `app/actions/profile.ts:removeProfileImageAction`**

Push to auth from the action layer (it has access to headers via `next/headers`):

```ts
"use server";

import { headers as nextHeaders } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteProfileImage } from "@/lib/user-profile/deleteProfileImage";
import { patchAuthUserImage } from "@/lib/auth/patchAuthUserImage";

export async function profileNameAction(name: string) {
  const { userId } = await requireUser();
  const trimmed = name.trim();
  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { userId };
}

export async function removeProfileImageAction() {
  const { userId } = await requireUser();
  const result = await deleteProfileImage(userId);
  await patchAuthUserImage(await nextHeaders(), null);
  return result;
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm test __tests__/api/upload-confirm.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/upload/profile-image/confirm/route.ts app/actions/profile.ts __tests__/api/upload-confirm.test.ts
git commit -m "feat: push forum image edits to auth via PATCH /api/user/image (Plan 2)"
```

---

### Task 11: Final green-gate + manual smoke + PR

- [ ] **Step 1: Run full green gate**

```bash
pnpm test
pnpm typecheck
pnpm eslint
pnpm build
```

All four must pass. If any fail, fix the regression and commit before proceeding.

- [ ] **Step 2: Manual smoke test**

Start the dev server (`pnpm dev`) with the auth project ALSO running (or pointed at a deployed auth that has Plan 1). Then:

1. Sign in fresh on the forum. Verify in the forum DB that `users.username` is populated and `users.imageUrl` mirrors the auth image (when the row was new).
2. Create a post. Verify `posts.creator_username` matches `session.user.username`.
3. Create a comment. Verify `comments.creator_display_text` matches.
4. Open a post by a user whose row pre-existed with NULL creator_username (legacy). Verify the UI renders `u/deleted` instead of crashing.
5. Edit your profile name in the forum. Verify `users.name` updates but `posts.creator_username` / `comments.creator_display_text` are unchanged.
6. Upload a new profile image. Verify (a) forum `users.imageUrl` updates, (b) auth user's image updates (check via the auth admin console OR by opening another sibling app and seeing the new image in the session).
7. Delete the profile image. Verify both forum and auth clear it.
8. Sign in on a different device / clear cookies and re-sign in. Verify forum image is preserved (because local was non-null, pull doesn't clobber).

Write a short observation per step. If anything fails, fix before opening the PR.

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin feat/plan-2-forum-username-image-sync
gh pr create --title "feat: Plan 2 — forum username & image sync" --body "$(cat <<'EOF'
## Summary

- Adds `users.username` column; syncs it from `session.user.username` on every provision.
- Makes `posts.creator_username` and `comments.creator_display_text` nullable; new writes store real username, old rows nulled out (legacy display names were lies).
- Renders `u/<username>` everywhere via `formatUserHandle`; null → `u/deleted`.
- Deletes the name-fanout rewriters; profile renames no longer touch caches.
- Pushes forum-side image edits back to auth via `PATCH /api/user/image`.
- Pulls auth's image into forum only when local is empty (preserves forum's write authority).

## Spec

`docs/superpowers/specs/2026-05-21-forum-username-and-image-sync-design.md`

## Hard prerequisite

Auth-side Plan 1 must be deployed in any env where this runs, or the image push 404s (best-effort, logs only).

## Test plan

- [x] `pnpm test`
- [x] `pnpm typecheck`
- [x] `pnpm eslint`
- [x] `pnpm build`
- [x] Manual smoke (see plan §Task 11 Step 2)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes (built into plan)

- **Spec coverage**: every spec section maps to a task. Schema → Task 1. Provisioning → Tasks 3+4. Display contract → Tasks 5+6+7. Removals → Task 8. Image push → Tasks 9+10. Migration steps → Task 1 Step 2. Testing → tasks include unit + integration; manual smoke in Task 11.
- **Type consistency**: `username: string | null` and `image: string | null` used consistently across `provisionLocalUser` input, `createPost` / `createComment` author arg, `types/post.ts`, `types/comment.ts`, `formatUserHandle` signature, and `patchAuthUserImage` signature.
- **Known TBD that's intentional**: comment-creation file path was confirmed during planning as `lib/comments/createComment.ts`. No further locator needed.
- **Tests that may need adjustment beyond what's listed**: any render-snapshot test that snapshots the old display name. Updated under Task 7 Step 4.
