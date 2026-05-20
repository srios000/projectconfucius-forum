# Forum Phase B — Image storage on Cloudflare R2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three Phase-A-stubbed image surfaces (post images, community logos, profile avatars) to Cloudflare R2 via a presign + confirm route pattern, with best-effort cleanup on replace and entity delete. No server-side image processing.

**Architecture:** A single `lib/storage/r2-forum.ts` module exposes presign / head / delete / public-URL helpers and three key-builders. Six route handlers under `app/api/upload/{post-image,community-image,profile-image}/{presign,confirm}` mediate every upload (auth + content-type validation + `HeadObject` verification). A client helper `lib/upload/uploadImage.ts` orchestrates the three steps so the consumer components only call one function. `useSelectFile` is extended to expose the raw `Blob` alongside its existing data-URL preview.

**Tech Stack:** Next.js 16 App Router, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (matches projectk), Better Auth (already wired from Phase A), Drizzle (already wired), Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-05-20-forum-phase-b-r2-storage-design.md`

**Conventions for the executor:**
- Path alias `@/*` → repo root (e.g. `@/lib/storage/r2-forum` → `lib/storage/r2-forum.ts`).
- Green gate (run after every task and at the end): `pnpm test; pnpm typecheck; pnpm lint; pnpm build`.
- Commit after every task with the message shown. Stage **explicit paths only** — the working tree contains pre-existing local modifications outside Phase B's scope; do **not** `git add -A`.
- Branch: work happens on `feat/phase-b-r2-storage` (already created and current; the spec commit `c0cff8a` is its first commit).
- Vitest does not auto-load `.env` (see `vitest.setup.ts`) — for tests that need R2 env vars, set them inline at the top of the test file with `process.env.FORUM_R2_* = "..."` before the `import` of the module under test, or use `vi.stubEnv` inside `beforeEach`.

---

## File structure (Phase B)

**Created:**
- `lib/storage/r2-forum.ts` — R2 S3 client + key-builders + presign/head/delete/public-URL helpers
- `lib/upload/uploadImage.ts` — client orchestration helper (presign → PUT → confirm)
- `lib/auth/requireModerator.ts` — server helper: throws/returns 403 unless caller is a moderator of a given communityId
- `app/api/upload/post-image/presign/route.ts`
- `app/api/upload/post-image/confirm/route.ts`
- `app/api/upload/community-image/presign/route.ts`
- `app/api/upload/community-image/confirm/route.ts`
- `app/api/upload/profile-image/presign/route.ts`
- `app/api/upload/profile-image/confirm/route.ts`
- `__tests__/storage/r2-forum.test.ts`
- `__tests__/api/upload-presign.test.ts`
- `__tests__/api/upload-confirm.test.ts`
- `__tests__/upload/uploadImage.test.ts`
- `__tests__/auth/requireModerator.test.ts`

**Modified:**
- `hooks/useSelectFile.tsx` — add `selectedBlob` (Blob via `canvas.toBlob`)
- `components/posts/new-post-form/NewPostForm.tsx` — upload image before `handleCreatePost`
- `hooks/posts/useCreatePost.ts` — accept and persist `imageUrl?` (currently drops it)
- `hooks/useUserProfile.ts` — `updateImage` now calls `uploadImage("profile-image", blob)`
- `hooks/community/useCommunityImage.ts` — `updateImage` now calls `uploadImage("community-image", blob, communityId)`
- `components/modal/profile/ProfileModal.tsx` — pass `selectedBlob` instead of data-URL to `updateImage`
- `components/modal/community-settings/CommunitySettings.tsx` — same shape
- `lib/posts/deletePost.ts` — fetch imageUrl first; cleanup after row deletion
- `lib/community/deleteCommunity.ts` — fetch community + post imageUrls; cleanup after row deletion
- `lib/user-profile/deleteProfileImage.ts` — best-effort R2 delete of the old key
- `lib/community/deleteCommunityImage.ts` — best-effort R2 delete of the old key
- `app/actions/profile.ts` — drop `profileImageAction` (confirm route owns the write)
- `app/actions/community.ts` — drop `updateCommunityImageAction`
- `.env.example` — add five `FORUM_R2_*` vars
- `package.json` — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `README.md` — replace Firebase Storage mention with R2 setup notes

**Removed:**
- `lib/user-profile/uploadProfileImage.ts` (Phase A stub)
- `lib/community/updateCommunityImage.ts` (Phase A stub)

---

## Task 1: Dependencies & env

**Files:**
- Modify: `package.json`, `.env.example`

- [x] **Step 1: Add R2 SDK deps**

Run:
```bash
pnpm add @aws-sdk/client-s3@^3.1020.0 @aws-sdk/s3-request-presigner@^3.1020.0
```

(Versions pinned to projectk's for cross-app consistency.)

- [x] **Step 2: Append five env vars to `.env.example`**

Append to the existing `.env.example`:
```
# Cloudflare R2 — forum image bucket
FORUM_R2_ACCOUNT_ID=e170f29c3780e7a07f8119776f0a5fae
FORUM_R2_ACCESS_KEY_ID=
FORUM_R2_SECRET_ACCESS_KEY=
FORUM_R2_BUCKET_NAME=project-confucius-forum
FORUM_R2_PUBLIC_URL=https://litang.projectconfucius.id
```

(Account id and public URL are not secrets — they live in `.env.example` so a new clone has the right values out of the box. The two keys stay blank in the example.)

- [x] **Step 3: Sanity check — no source files reference R2 yet**

Run: `pnpm typecheck`
Expected: PASS (no R2 imports anywhere yet — this is just to confirm the dep install didn't break anything).

- [x] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: add @aws-sdk for R2 + .env.example FORUM_R2_* vars

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: R2 storage module + key-builders

**Files:**
- Create: `lib/storage/r2-forum.ts`
- Test: `__tests__/storage/r2-forum.test.ts`

- [x] **Step 1: Write failing test `__tests__/storage/r2-forum.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
  vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
  vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
  vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
});

describe("r2-forum key-builders", () => {
  it("postImageKey shape", async () => {
    const { postImageKey } = await import("@/lib/storage/r2-forum");
    expect(postImageKey("abc-123", "jpg")).toBe("posts/abc-123.jpg");
  });

  it("communityImageKey shape", async () => {
    const { communityImageKey } = await import("@/lib/storage/r2-forum");
    expect(communityImageKey("cricket", "abc-123", "png")).toBe(
      "communities/cricket/abc-123.png"
    );
  });

  it("userImageKey shape", async () => {
    const { userImageKey } = await import("@/lib/storage/r2-forum");
    expect(userImageKey("u1", "abc-123", "gif")).toBe("users/u1/abc-123.gif");
  });

  it("extFromContentType maps the three allowed types", async () => {
    const { extFromContentType } = await import("@/lib/storage/r2-forum");
    expect(extFromContentType("image/jpeg")).toBe("jpg");
    expect(extFromContentType("image/png")).toBe("png");
    expect(extFromContentType("image/gif")).toBe("gif");
    expect(extFromContentType("image/webp")).toBeNull();
  });
});

describe("r2-forum public URL round-trip", () => {
  it("getForumPublicUrl joins host + key with a single slash", async () => {
    const { getForumPublicUrl } = await import("@/lib/storage/r2-forum");
    expect(getForumPublicUrl("posts/x.jpg")).toBe(
      "https://litang.projectconfucius.id/posts/x.jpg"
    );
  });

  it("parseForumObjectKey returns the key for our public host", async () => {
    const { parseForumObjectKey } = await import("@/lib/storage/r2-forum");
    expect(
      parseForumObjectKey("https://litang.projectconfucius.id/posts/x.jpg")
    ).toBe("posts/x.jpg");
  });

  it("parseForumObjectKey returns null for foreign URLs", async () => {
    const { parseForumObjectKey } = await import("@/lib/storage/r2-forum");
    expect(parseForumObjectKey("https://example.com/posts/x.jpg")).toBeNull();
    expect(parseForumObjectKey("")).toBeNull();
    expect(parseForumObjectKey(null as unknown as string)).toBeNull();
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/storage/r2-forum.test.ts`
Expected: FAIL (module does not exist).

- [x] **Step 3: Write `lib/storage/r2-forum.ts`**

```ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// FORUM_R2_* preferred; fall back to shared R2_* (matches projectk's
// per-domain-with-shared-fallback convention).
const accountId = process.env.FORUM_R2_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID;
const accessKeyId =
  process.env.FORUM_R2_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.FORUM_R2_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY;

const BUCKET = process.env.FORUM_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.FORUM_R2_PUBLIC_URL!;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
});

export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/gif"] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB, matches useSelectFile

const EXT_BY_TYPE: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

export function extFromContentType(contentType: string): string | null {
  return (EXT_BY_TYPE as Record<string, string>)[contentType] ?? null;
}

export function postImageKey(fileId: string, ext: string): string {
  return `posts/${fileId}.${ext}`;
}

export function communityImageKey(communityId: string, fileId: string, ext: string): string {
  return `communities/${communityId}/${fileId}.${ext}`;
}

export function userImageKey(userId: string, fileId: string, ext: string): string {
  return `users/${userId}/${fileId}.${ext}`;
}

export function getForumPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/** Returns the R2 key if `url` is on our public host, else null. */
export function parseForumObjectKey(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const prefix = `${PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length) || null;
}

export async function generateForumPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function forumObjectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteForumObject(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/storage/r2-forum.test.ts`
Expected: PASS (all 7).

- [x] **Step 5: Commit**

```bash
git add lib/storage/r2-forum.ts tests/storage/r2-forum.test.ts
git commit -m "feat: r2-forum storage module + key-builders

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Moderator guard helper

**Files:**
- Create: `lib/auth/requireModerator.ts`
- Test: `__tests__/auth/requireModerator.test.ts`

The community-image presign and confirm routes both need "is this user a moderator of communityId?". Extract once.

- [x] **Step 1: Write failing test `__tests__/auth/requireModerator.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { query: { communityMembers: { findFirst } } },
}));

import { isModerator } from "@/lib/auth/requireModerator";

beforeEach(() => findFirst.mockReset());

describe("isModerator", () => {
  it("true when row exists with isModerator=true", async () => {
    findFirst.mockResolvedValueOnce({ isModerator: true });
    expect(await isModerator("u1", "c1")).toBe(true);
  });
  it("false when row exists but isModerator=false", async () => {
    findFirst.mockResolvedValueOnce({ isModerator: false });
    expect(await isModerator("u1", "c1")).toBe(false);
  });
  it("false when no membership row", async () => {
    findFirst.mockResolvedValueOnce(undefined);
    expect(await isModerator("u1", "c1")).toBe(false);
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/auth/requireModerator.test.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Write `lib/auth/requireModerator.ts`**

```ts
import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/** Returns true iff the user is a moderator of the given community. */
export async function isModerator(userId: string, communityId: string): Promise<boolean> {
  const row = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.userId, userId),
      eq(communityMembers.communityId, communityId),
    ),
    columns: { isModerator: true },
  });
  return !!row?.isModerator;
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/auth/requireModerator.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/auth/requireModerator.ts tests/auth/requireModerator.test.ts
git commit -m "feat: isModerator helper for community-image upload guards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Post-image upload routes

**Files:**
- Create: `app/api/upload/post-image/presign/route.ts`, `app/api/upload/post-image/confirm/route.ts`
- Test: `__tests__/api/upload-presign.test.ts` (post-image suite), `__tests__/api/upload-confirm.test.ts` (post-image suite)

- [x] **Step 1: Write failing test for presign (post-image suite) — `__tests__/api/upload-presign.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("@/lib/storage/r2-forum", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
    "@/lib/storage/r2-forum",
  );
  return {
    ...actual,
    generateForumPresignedPutUrl: vi.fn(async (k: string) => `https://signed.test/${k}`),
  };
});

beforeEach(() => {
  vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
  vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
  vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
  vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
  getSession.mockReset();
});

async function post(url: string, body: unknown) {
  const { POST } = await import(
    /* @vite-ignore */ url
  );
  const req = new Request("http://test.local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/upload/post-image/presign", () => {
  it("401 unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/jpeg" });
    expect(res.status).toBe(401);
  });

  it("400 disallowed content-type", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1" } });
    const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/webp" });
    expect(res.status).toBe(400);
  });

  it("200 happy path returns presignedUrl + key + publicUrl + maxSize", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1" } });
    const res = await post("@/app/api/upload/post-image/presign/route", { contentType: "image/jpeg" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.presignedUrl).toMatch(/^https:\/\/signed\.test\//);
    expect(json.key).toMatch(/^posts\/[0-9a-f-]+\.jpg$/);
    expect(json.publicUrl).toMatch(/^https:\/\/litang\.projectconfucius\.id\/posts\//);
    expect(json.maxSize).toBe(10 * 1024 * 1024);
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: FAIL (route does not exist).

- [x] **Step 3: Write `app/api/upload/post-image/presign/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  extFromContentType,
  generateForumPresignedPutUrl,
  getForumPublicUrl,
  postImageKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { contentType?: string };
  const contentType = body.contentType ?? "";
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      {
        message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const ext = extFromContentType(contentType)!;
  const fileId = crypto.randomUUID();
  const key = postImageKey(fileId, ext);
  const presignedUrl = await generateForumPresignedPutUrl(key, contentType);

  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: getForumPublicUrl(key),
    maxSize: MAX_IMAGE_BYTES,
  });
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: PASS (3 in the post-image suite).

- [x] **Step 5: Write failing test for confirm (post-image suite) — `__tests__/api/upload-confirm.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
const forumObjectExists = vi.fn();
vi.mock("@/lib/storage/r2-forum", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
    "@/lib/storage/r2-forum",
  );
  return { ...actual, forumObjectExists };
});

beforeEach(() => {
  vi.stubEnv("FORUM_R2_ACCOUNT_ID", "test-account");
  vi.stubEnv("FORUM_R2_ACCESS_KEY_ID", "test-key");
  vi.stubEnv("FORUM_R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("FORUM_R2_BUCKET_NAME", "test-bucket");
  vi.stubEnv("FORUM_R2_PUBLIC_URL", "https://litang.projectconfucius.id");
  getSession.mockReset();
  forumObjectExists.mockReset();
});

async function post(url: string, body: unknown) {
  const { POST } = await import(/* @vite-ignore */ url);
  const req = new Request("http://test.local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/upload/post-image/confirm", () => {
  it("401 unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
    expect(res.status).toBe(401);
  });

  it("400 HeadObject misses", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1" } });
    forumObjectExists.mockResolvedValueOnce(false);
    const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
    expect(res.status).toBe(400);
  });

  it("200 returns imageUrl without touching the DB", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1" } });
    forumObjectExists.mockResolvedValueOnce(true);
    const res = await post("@/app/api/upload/post-image/confirm/route", { key: "posts/x.jpg" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.imageUrl).toBe("https://litang.projectconfucius.id/posts/x.jpg");
  });
});
```

- [x] **Step 6: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: FAIL (route does not exist).

- [x] **Step 7: Write `app/api/upload/post-image/confirm/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { forumObjectExists, getForumPublicUrl } from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { key?: string };
  const key = body.key ?? "";
  if (!key.startsWith("posts/")) {
    return NextResponse.json({ message: "Invalid key" }, { status: 400 });
  }

  if (!(await forumObjectExists(key))) {
    return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
  }

  return NextResponse.json({ imageUrl: getForumPublicUrl(key) });
}
```

- [x] **Step 8: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: PASS (3 in the post-image suite).

- [x] **Step 9: Commit**

```bash
git add app/api/upload/post-image tests/api/upload-presign.test.ts tests/api/upload-confirm.test.ts
git commit -m "feat: post-image presign + confirm routes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Community-image upload routes

**Files:**
- Create: `app/api/upload/community-image/presign/route.ts`, `app/api/upload/community-image/confirm/route.ts`
- Modify: `__tests__/api/upload-presign.test.ts` (add community-image suite), `__tests__/api/upload-confirm.test.ts` (add community-image suite)

The community-image confirm route is the **first** one that writes to the DB. It must (a) verify the caller is a moderator and (b) read the old `communities.imageUrl` to delete the old key after the update commits.

- [x] **Step 1: Append community-image suite to `__tests__/api/upload-presign.test.ts`**

After the post-image `describe` block, add:

```ts
const isModerator = vi.fn();
vi.mock("@/lib/auth/requireModerator", () => ({ isModerator }));
const provisionLocalUser = vi.fn(async (i: { authUserId: string }) => ({ id: `local-${i.authUserId}` }));
vi.mock("@/lib/auth/provision", () => ({ provisionLocalUser }));

describe("POST /api/upload/community-image/presign", () => {
  it("401 unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await post(
      "@/app/api/upload/community-image/presign/route",
      { contentType: "image/jpeg", communityId: "cricket" },
    );
    expect(res.status).toBe(401);
  });

  it("400 disallowed content-type", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    const res = await post(
      "@/app/api/upload/community-image/presign/route",
      { contentType: "image/webp", communityId: "cricket" },
    );
    expect(res.status).toBe(400);
  });

  it("403 not a moderator", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(false);
    const res = await post(
      "@/app/api/upload/community-image/presign/route",
      { contentType: "image/jpeg", communityId: "cricket" },
    );
    expect(res.status).toBe(403);
  });

  it("200 happy path returns key under communities/<id>/", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(true);
    const res = await post(
      "@/app/api/upload/community-image/presign/route",
      { contentType: "image/jpeg", communityId: "cricket" },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.key).toMatch(/^communities\/cricket\/[0-9a-f-]+\.jpg$/);
  });
});
```

(`provisionLocalUser` is mocked because the route resolves session `user.id` (auth id) to local user id; mocking it returns a deterministic local id without DB.)

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: FAIL on the new community-image suite (route not found).

- [x] **Step 3: Write `app/api/upload/community-image/presign/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { isModerator } from "@/lib/auth/requireModerator";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  communityImageKey,
  extFromContentType,
  generateForumPresignedPutUrl,
  getForumPublicUrl,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { contentType?: string; communityId?: string };
  const { contentType = "", communityId = "" } = body;

  if (!communityId) {
    return NextResponse.json({ message: "Missing communityId" }, { status: 400 });
  }
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  });
  if (!(await isModerator(local.id, communityId))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const ext = extFromContentType(contentType)!;
  const fileId = crypto.randomUUID();
  const key = communityImageKey(communityId, fileId, ext);
  const presignedUrl = await generateForumPresignedPutUrl(key, contentType);
  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: getForumPublicUrl(key),
    maxSize: MAX_IMAGE_BYTES,
  });
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: PASS (community-image suite green, post-image still green).

- [x] **Step 5: Append community-image suite to `__tests__/api/upload-confirm.test.ts`**

```ts
const isModerator = vi.fn();
vi.mock("@/lib/auth/requireModerator", () => ({ isModerator }));
const provisionLocalUser = vi.fn(async (i: { authUserId: string }) => ({ id: `local-${i.authUserId}` }));
vi.mock("@/lib/auth/provision", () => ({ provisionLocalUser }));

const findFirst = vi.fn();
const updateSet = vi.fn();
const deleteForumObject = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    query: { communities: { findFirst } },
    update: () => ({ set: (v: unknown) => { updateSet(v); return { where: () => Promise.resolve() }; } }),
  },
}));
vi.mock("@/lib/storage/r2-forum", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storage/r2-forum")>(
    "@/lib/storage/r2-forum",
  );
  return { ...actual, forumObjectExists, deleteForumObject };
});

describe("POST /api/upload/community-image/confirm", () => {
  it("403 not a moderator", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(false);
    const res = await post(
      "@/app/api/upload/community-image/confirm/route",
      { key: "communities/cricket/abc.jpg", communityId: "cricket" },
    );
    expect(res.status).toBe(403);
  });

  it("400 HeadObject misses", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(true);
    forumObjectExists.mockResolvedValueOnce(false);
    const res = await post(
      "@/app/api/upload/community-image/confirm/route",
      { key: "communities/cricket/abc.jpg", communityId: "cricket" },
    );
    expect(res.status).toBe(400);
  });

  it("200 updates row + deletes old key", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(true);
    forumObjectExists.mockResolvedValueOnce(true);
    findFirst.mockResolvedValueOnce({
      imageUrl: "https://litang.projectconfucius.id/communities/cricket/old.jpg",
    });
    deleteForumObject.mockResolvedValueOnce(undefined);

    const res = await post(
      "@/app/api/upload/community-image/confirm/route",
      { key: "communities/cricket/abc.jpg", communityId: "cricket" },
    );
    expect(res.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://litang.projectconfucius.id/communities/cricket/abc.jpg",
      }),
    );
    expect(deleteForumObject).toHaveBeenCalledWith("communities/cricket/old.jpg");
  });

  it("200 even if old-key delete fails (best-effort)", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    isModerator.mockResolvedValueOnce(true);
    forumObjectExists.mockResolvedValueOnce(true);
    findFirst.mockResolvedValueOnce({
      imageUrl: "https://litang.projectconfucius.id/communities/cricket/old.jpg",
    });
    deleteForumObject.mockRejectedValueOnce(new Error("R2 down"));
    const res = await post(
      "@/app/api/upload/community-image/confirm/route",
      { key: "communities/cricket/abc.jpg", communityId: "cricket" },
    );
    expect(res.status).toBe(200);
  });
});
```

- [x] **Step 6: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: FAIL on the new community-image suite.

- [x] **Step 7: Write `app/api/upload/community-image/confirm/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { isModerator } from "@/lib/auth/requireModerator";
import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  deleteForumObject,
  forumObjectExists,
  getForumPublicUrl,
  parseForumObjectKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { key?: string; communityId?: string };
  const { key = "", communityId = "" } = body;
  if (!communityId || !key.startsWith(`communities/${communityId}/`)) {
    return NextResponse.json({ message: "Invalid key" }, { status: 400 });
  }

  const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  });
  if (!(await isModerator(local.id, communityId))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!(await forumObjectExists(key))) {
    return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
  }

  const existing = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { imageUrl: true },
  });
  const newUrl = getForumPublicUrl(key);
  await db.update(communities).set({ imageUrl: newUrl }).where(eq(communities.id, communityId));

  const oldKey = parseForumObjectKey(existing?.imageUrl);
  if (oldKey && oldKey !== key) {
    deleteForumObject(oldKey).catch((err) => {
      console.error("[community-image/confirm] best-effort delete failed", err);
    });
  }

  return NextResponse.json({ imageUrl: newUrl });
}
```

- [x] **Step 8: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: PASS (community-image suite green, post-image still green).

- [x] **Step 9: Commit**

```bash
git add app/api/upload/community-image tests/api/upload-presign.test.ts tests/api/upload-confirm.test.ts
git commit -m "feat: community-image presign + confirm routes with moderator authz

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Profile-image upload routes

**Files:**
- Create: `app/api/upload/profile-image/presign/route.ts`, `app/api/upload/profile-image/confirm/route.ts`
- Modify: `__tests__/api/upload-presign.test.ts`, `__tests__/api/upload-confirm.test.ts` (profile-image suites)

`userId` is taken from the session (never from the body). Any caller-supplied `userId` field is **ignored**.

- [x] **Step 1: Append profile-image suite to `__tests__/api/upload-presign.test.ts`**

```ts
describe("POST /api/upload/profile-image/presign", () => {
  it("401 unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await post(
      "@/app/api/upload/profile-image/presign/route",
      { contentType: "image/jpeg" },
    );
    expect(res.status).toBe(401);
  });

  it("400 disallowed content-type", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    const res = await post(
      "@/app/api/upload/profile-image/presign/route",
      { contentType: "image/webp" },
    );
    expect(res.status).toBe(400);
  });

  it("200 key uses session userId, ignoring any body.userId", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    const res = await post(
      "@/app/api/upload/profile-image/presign/route",
      { contentType: "image/jpeg", userId: "EVIL" },
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.key).toMatch(/^users\/local-a1\/[0-9a-f-]+\.jpg$/);
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: FAIL on profile-image suite.

- [x] **Step 3: Write `app/api/upload/profile-image/presign/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  extFromContentType,
  generateForumPresignedPutUrl,
  getForumPublicUrl,
  userImageKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { contentType?: string };
  const contentType = body.contentType ?? "";
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  });
  const ext = extFromContentType(contentType)!;
  const fileId = crypto.randomUUID();
  const key = userImageKey(local.id, fileId, ext);
  const presignedUrl = await generateForumPresignedPutUrl(key, contentType);
  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: getForumPublicUrl(key),
    maxSize: MAX_IMAGE_BYTES,
  });
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-presign.test.ts`
Expected: PASS (profile-image suite green; previous suites still green).

- [x] **Step 5: Append profile-image suite to `__tests__/api/upload-confirm.test.ts`**

```ts
const usersFindFirst = vi.fn();
// Extend the @/lib/db mock — declared at top of this file — to also expose
// `query.users.findFirst`. Since we used a hoisted factory, refactor by
// updating the existing `vi.mock("@/lib/db", ...)` block above to include:
//   query: { communities: { findFirst }, users: { findFirst: usersFindFirst } }
// (Implementer: move the usersFindFirst declaration above the vi.mock call
// and merge into the same factory object.)

describe("POST /api/upload/profile-image/confirm", () => {
  it("200 updates row + deletes old key", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    forumObjectExists.mockResolvedValueOnce(true);
    usersFindFirst.mockResolvedValueOnce({
      imageUrl: "https://litang.projectconfucius.id/users/local-a1/old.jpg",
    });
    deleteForumObject.mockResolvedValueOnce(undefined);

    const res = await post(
      "@/app/api/upload/profile-image/confirm/route",
      { key: "users/local-a1/abc.jpg" },
    );
    expect(res.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://litang.projectconfucius.id/users/local-a1/abc.jpg",
      }),
    );
    expect(deleteForumObject).toHaveBeenCalledWith("users/local-a1/old.jpg");
  });

  it("403 if the key is under a different user", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "a1", email: "a@a", name: "a" } });
    const res = await post(
      "@/app/api/upload/profile-image/confirm/route",
      { key: "users/local-OTHER/abc.jpg" },
    );
    expect(res.status).toBe(403);
  });
});
```

> Implementer note: this suite shares mocks with the community-image confirm suite. Refactor the existing `vi.mock("@/lib/db", …)` block at the top of the file to expose **both** `query.communities.findFirst` (named `findFirst`) and `query.users.findFirst` (named `usersFindFirst`), plus `update: () => ({ set: (v) => { updateSet(v); return { where: () => Promise.resolve() } } })` — `update()` returning the same chain is correct for both `communities` and `users` because Drizzle's `db.update(table)` is dispatched by argument; we don't need to discriminate in the mock.

- [x] **Step 6: Run test — expect FAIL**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: FAIL on profile-image suite.

- [x] **Step 7: Write `app/api/upload/profile-image/confirm/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  deleteForumObject,
  forumObjectExists,
  getForumPublicUrl,
  parseForumObjectKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const local = await provisionLocalUser({
    authUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  });

  const body = (await req.json()) as { key?: string };
  const key = body.key ?? "";
  if (!key.startsWith(`users/${local.id}/`)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!(await forumObjectExists(key))) {
    return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.id, local.id),
    columns: { imageUrl: true },
  });
  const newUrl = getForumPublicUrl(key);
  await db.update(users).set({ imageUrl: newUrl, updatedAt: new Date() }).where(eq(users.id, local.id));

  const oldKey = parseForumObjectKey(existing?.imageUrl);
  if (oldKey && oldKey !== key) {
    deleteForumObject(oldKey).catch((err) => {
      console.error("[profile-image/confirm] best-effort delete failed", err);
    });
  }

  return NextResponse.json({ imageUrl: newUrl });
}
```

- [x] **Step 8: Run test — expect PASS**

Run: `pnpm test __tests__/api/upload-confirm.test.ts`
Expected: PASS (profile-image suite green; previous suites still green).

- [x] **Step 9: Commit**

```bash
git add app/api/upload/profile-image tests/api/upload-presign.test.ts tests/api/upload-confirm.test.ts
git commit -m "feat: profile-image presign + confirm routes (self-only authz)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Extend `useSelectFile` to expose Blob

**Files:**
- Modify: `hooks/useSelectFile.tsx`
- Modify (if it asserts the hook's return shape): `__tests__/hooks/useSelectFile.test.tsx`

- [x] **Step 1: Add `selectedBlob` to `hooks/useSelectFile.tsx`**

Replace the body of the existing `onload` handler so it produces **both** a data URL (existing preview behavior) and a JPEG `Blob`:

```tsx
// inside image.onload, replace the existing canvas + toDataURL block:
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = image.width;
canvas.height = image.height;
ctx?.drawImage(image, 0, 0, image.width, image.height);

const resizedImage = canvas.toDataURL("image/jpeg", 1.0);
setSelectedFile(resizedImage);

canvas.toBlob(
  (blob) => {
    if (blob) setSelectedBlob(blob);
  },
  "image/jpeg",
  1.0,
);
```

Add the new state at the top of the hook, alongside `selectedFile`:

```tsx
const [selectedBlob, setSelectedBlob] = useState<Blob | undefined>();
```

Extend the returned object:

```tsx
return {
  selectedFile,
  selectedBlob,
  setSelectedFile: (s: string | undefined) => {
    setSelectedFile(s);
    if (!s) setSelectedBlob(undefined);
  },
  onSelectFile,
};
```

(The setter wrapper clears the blob whenever the data URL is cleared, so `setSelectedFile("")` in `closeModal` correctly resets both.)

- [x] **Step 2: If the existing useSelectFile test asserts the return shape, extend it**

Run: `pnpm test __tests__/hooks/useSelectFile.test.tsx`

If it passes unchanged, skip the edit. If it fails because of the new return key, add a single assertion that `selectedBlob` is `undefined` initially:

```tsx
// in the existing "initial state" test:
expect(result.current.selectedBlob).toBeUndefined();
```

- [x] **Step 3: Green gate the hook**

Run: `pnpm test __tests__/hooks/useSelectFile.test.tsx; pnpm typecheck`
Expected: both PASS.

- [x] **Step 4: Commit**

```bash
git add hooks/useSelectFile.tsx __tests__/hooks/useSelectFile.test.tsx
git commit -m "feat: useSelectFile exposes selectedBlob (JPEG via canvas.toBlob)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Client upload helper `lib/upload/uploadImage.ts`

**Files:**
- Create: `lib/upload/uploadImage.ts`
- Test: `__tests__/upload/uploadImage.test.ts`

- [x] **Step 1: Write failing test `__tests__/upload/uploadImage.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("uploadImage", () => {
  it("presigns, PUTs to R2, confirms, returns imageUrl", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            presignedUrl: "https://signed.test/key",
            key: "posts/abc.jpg",
            publicUrl: "https://litang.projectconfucius.id/posts/abc.jpg",
            maxSize: 10485760,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            imageUrl: "https://litang.projectconfucius.id/posts/abc.jpg",
          }),
          { status: 200 },
        ),
      );

    const { uploadImage } = await import("@/lib/upload/uploadImage");
    const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
    const { imageUrl } = await uploadImage("post-image", blob);
    expect(imageUrl).toBe("https://litang.projectconfucius.id/posts/abc.jpg");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/upload/post-image/presign");
    expect(fetchMock.mock.calls[1][0]).toBe("https://signed.test/key");
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/upload/post-image/confirm");
  });

  it("throws on presign 4xx", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid content type" }), { status: 400 }),
    );
    const { uploadImage } = await import("@/lib/upload/uploadImage");
    const blob = new Blob([new Uint8Array(8)], { type: "image/webp" });
    await expect(uploadImage("post-image", blob)).rejects.toThrow(/Invalid content type/);
  });

  it("throws on R2 PUT failure", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            presignedUrl: "https://signed.test/key",
            key: "posts/abc.jpg",
            publicUrl: "x",
            maxSize: 1,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    const { uploadImage } = await import("@/lib/upload/uploadImage");
    const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
    await expect(uploadImage("post-image", blob)).rejects.toThrow(/upload to R2/i);
  });

  it("passes communityId for community-image surface", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            presignedUrl: "https://signed.test/key",
            key: "communities/c1/abc.jpg",
            publicUrl: "x",
            maxSize: 1,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: "x" }), { status: 200 }));
    const { uploadImage } = await import("@/lib/upload/uploadImage");
    const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });
    await uploadImage("community-image", blob, "c1");
    const presignBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const confirmBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
    expect(presignBody.communityId).toBe("c1");
    expect(confirmBody.communityId).toBe("c1");
  });
});
```

- [x] **Step 2: Run test — expect FAIL**

Run: `pnpm test __tests__/upload/uploadImage.test.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Write `lib/upload/uploadImage.ts`**

```ts
export type UploadSurface = "post-image" | "community-image" | "profile-image";

type PresignResponse = {
  presignedUrl: string;
  key: string;
  publicUrl: string;
  maxSize: number;
};

async function readErr(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string };
    return j.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Three-step client-side upload: presign → PUT to R2 → confirm.
 * Returns the final public URL. Throws on any non-2xx step.
 */
export async function uploadImage(
  surface: UploadSurface,
  blob: Blob,
  surfaceId?: string,
): Promise<{ imageUrl: string }> {
  const presignBody: Record<string, unknown> = { contentType: blob.type };
  if (surface === "community-image") presignBody.communityId = surfaceId;

  const presignRes = await fetch(`/api/upload/${surface}/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(presignBody),
  });
  if (!presignRes.ok) throw new Error(`presign: ${await readErr(presignRes)}`);
  const { presignedUrl, key } = (await presignRes.json()) as PresignResponse;

  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "content-type": blob.type },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`upload to R2 failed (HTTP ${putRes.status})`);

  const confirmBody: Record<string, unknown> = { key };
  if (surface === "community-image") confirmBody.communityId = surfaceId;

  const confirmRes = await fetch(`/api/upload/${surface}/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(confirmBody),
  });
  if (!confirmRes.ok) throw new Error(`confirm: ${await readErr(confirmRes)}`);
  return (await confirmRes.json()) as { imageUrl: string };
}
```

- [x] **Step 4: Run test — expect PASS**

Run: `pnpm test __tests__/upload/uploadImage.test.ts`
Expected: PASS (all 4).

- [x] **Step 5: Commit**

```bash
git add lib/upload/uploadImage.ts tests/upload/uploadImage.test.ts
git commit -m "feat: client uploadImage helper (presign → PUT → confirm)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Wire `NewPostForm` to upload before create

**Files:**
- Modify: `hooks/posts/useCreatePost.ts`, `components/posts/new-post-form/NewPostForm.tsx`

The Phase A `useCreatePost` accepts `selectedFile` but drops it. We change the signature to accept an optional `Blob`, upload it via `uploadImage("post-image", blob)` first, and pass the resulting URL into `createPostAction`.

- [x] **Step 1: Update `hooks/posts/useCreatePost.ts`**

Replace the `handleCreatePost` body:

```ts
import { uploadImage } from "@/lib/upload/uploadImage";
// ... existing imports

const handleCreatePost = async (
  communityId: string,
  communityImageURL: string | undefined,
  postData: { title: string; body: string },
  selectedBlob?: Blob,
) => {
  if (!session?.user) {
    window.location.assign("/api/auth/start");
    return;
  }
  setLoading(true);

  const currentCommunity = communityStateValue.currentCommunity;
  if (currentCommunity?.id === communityId) {
    const hasPermission = checkCommunityPermission(currentCommunity, communityStateValue.mySnippets);
    if (!hasPermission) {
      showToast({
        title: "Restricted Community",
        description: "You must be a member to post in this community.",
        status: "error",
      });
      setLoading(false);
      return;
    }
  }

  try {
    let imageUrl: string | undefined;
    if (selectedBlob) {
      const result = await uploadImage("post-image", selectedBlob);
      imageUrl = result.imageUrl;
    }
    await createPostAction(communityId, communityImageURL, postData, imageUrl);
    router.back();
    showToast({
      title: "Post Created",
      description: "Your post has been created successfully",
      status: "success",
    });
  } catch (err) {
    console.log("handleCreatePost error", err);
    setError(true);
    showToast({
      title: "Error Creating Post",
      description: err instanceof Error ? err.message : "There was an error creating your post",
      status: "error",
    });
  } finally {
    setLoading(false);
  }
};
```

Remove the `eslint-disable @typescript-eslint/no-unused-vars` line above `selectedFile` — the parameter is now used.

- [x] **Step 2: Update `components/posts/new-post-form/NewPostForm.tsx`**

In the submit handler, replace the `selectedFile` argument (a data URL) with `selectedBlob`:

```tsx
const { selectedFile, setSelectedFile, selectedBlob, onSelectFile } = useSelectFile(3000, 3000);
// ...
const onCreatePost = handleSubmit(async (data) => {
  await handleCreatePost(
    params.communityId as string,
    currentCommunity?.imageUrl,
    data,
    selectedBlob,
  );
});
```

(Pass `selectedBlob` only — `selectedFile` is still used for the in-form preview but it isn't what goes on the wire.)

- [x] **Step 3: Green gate**

Run: `pnpm typecheck; pnpm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add hooks/posts/useCreatePost.ts components/posts/new-post-form/NewPostForm.tsx
git commit -m "feat: NewPostForm uploads image via uploadImage before createPost

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Wire `ProfileModal` (real upload)

**Files:**
- Modify: `hooks/useUserProfile.ts`, `components/modal/profile/ProfileModal.tsx`

- [x] **Step 1: Rewrite `useUserProfile.updateImage`**

Replace the Phase A "coming soon" stub with the real upload:

```ts
import { uploadImage } from "@/lib/upload/uploadImage";

const updateImage = async (blob: Blob) => {
  if (!user) return false;
  try {
    setLoading(true);
    await uploadImage("profile-image", blob);
    router.refresh();
    showToast({
      title: "Profile updated",
      description: "Your profile image has been updated",
      status: "success",
    });
    return true;
  } catch (err) {
    console.error("Error: updateImage:", err);
    showToast({
      title: "Image not Updated",
      description: err instanceof Error ? err.message : "Failed to upload image",
      status: "error",
    });
    return false;
  } finally {
    setLoading(false);
  }
};
```

(Parameter type changes from `_selectedFile: string` to `blob: Blob` — callers updated in the next step.)

- [x] **Step 2: Update `components/modal/profile/ProfileModal.tsx`**

Pull `selectedBlob` from `useSelectFile`, pass it to `updateImage`:

```tsx
const { selectedFile, selectedBlob, setSelectedFile, onSelectFile } = useSelectFile(300, 300);
// ...
const onUpdateProfile = async (data: EditProfileInput) => {
  if (selectedBlob) {
    await updateImage(selectedBlob);
  }
  if (deleteImage) {
    await removeImage();
  }
  if (data.displayName !== user?.name) {
    await updateName(data.displayName);
  }
  closeModal();
};
```

- [x] **Step 3: Green gate**

Run: `pnpm typecheck; pnpm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add hooks/useUserProfile.ts components/modal/profile/ProfileModal.tsx
git commit -m "feat: profile image upload via uploadImage (replaces \"coming soon\" stub)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Wire `CommunitySettings` (real upload)

**Files:**
- Modify: `hooks/community/useCommunityImage.ts`, `components/modal/community-settings/CommunitySettings.tsx`

- [x] **Step 1: Rewrite `useCommunityImage.onUpdateImage`**

Replace the Phase A action-call body:

```ts
import { uploadImage } from "@/lib/upload/uploadImage";
// remove: import { updateCommunityImageAction } from "@/app/actions/community";
import { deleteCommunityImageAction } from "@/app/actions/community";

const onUpdateImage = async (blob: Blob) => {
  if (!blob) return;
  setUploadingImage(true);

  try {
    const { imageUrl } = await uploadImage("community-image", blob, communityData.id);

    setCommunityStateValue((prev) => ({
      ...prev,
      currentCommunity: { ...prev.currentCommunity, imageUrl } as Community,
    }));
    setCommunityStateValue((prev) => ({
      ...prev,
      mySnippets: prev.mySnippets.map((snippet) =>
        snippet.communityId === communityData.id ? { ...snippet, imageUrl } : snippet,
      ),
    }));
  } catch (err) {
    console.log("Error: onUploadImage", err);
    showToast({
      title: "Image not Updated",
      description: err instanceof Error ? err.message : "There was an error updating the image",
      status: "error",
    });
  } finally {
    setUploadingImage(false);
  }
};
```

**Naming check before committing:** the existing `useCommunityImage` Jotai writes use `imageURL` (uppercase URL), but the Phase A `Community` type in `types/community.ts` declares `imageUrl` (lowercase). Use whichever the type declares — `imageUrl` in the new body above is correct if `Community.imageUrl` exists. Verify with `grep -n "imageURL\\|imageUrl" types/community.ts types/communitySnippet.ts` first; if the types declare `imageURL`, change the new body to match (and fix any tsc complaints surfaced by Task 11 Step 3's green gate either way).

- [x] **Step 2: Update `components/modal/community-settings/CommunitySettings.tsx`**

Pull `selectedBlob` from `useSelectFile`; pass it to `updateImage`:

```tsx
const { selectedFile, selectedBlob, setSelectedFile, onSelectFile } = useSelectFile(300, 300);
// ...
const handleSaveButtonClick = async () => {
  if (selectedPrivacyType) {
    await updatePrivacyType(selectedPrivacyType);
  }
  if (selectedBlob) {
    await updateImage(selectedBlob);
    setSelectedFile("");
  }
  if (deleteImage) {
    await deleteCommunityImage();
  }
  showToast({
    title: "Settings Updated",
    description: "Your settings have been updated",
    status: "success",
  });
  closeModal();
};
```

- [x] **Step 3: Green gate**

Run: `pnpm typecheck; pnpm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add hooks/community/useCommunityImage.ts components/modal/community-settings/CommunitySettings.tsx
git commit -m "feat: community image upload via uploadImage

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Cleanup on entity delete

**Files:**
- Modify: `lib/posts/deletePost.ts`, `lib/community/deleteCommunity.ts`, `lib/user-profile/deleteProfileImage.ts`, `lib/community/deleteCommunityImage.ts`

All four functions follow the same pattern: fetch the imageUrl(s) first, do the DB delete, then fire-and-forget R2 deletes. Failures log but never throw.

- [x] **Step 1: Update `lib/posts/deletePost.ts`**

```ts
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

export const deletePost = async (postId: string) => {
  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { imageUrl: true },
  });
  await db.delete(posts).where(eq(posts.id, postId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deletePost] best-effort R2 delete failed", err);
    });
  }
};
```

- [x] **Step 2: Update `lib/community/deleteCommunity.ts`**

```ts
import { db } from "@/lib/db";
import { communities, posts } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { eq, isNotNull, and } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

export const deleteCommunity = async (communityData: Community) => {
  const [community, postRows] = await Promise.all([
    db.query.communities.findFirst({
      where: eq(communities.id, communityData.id),
      columns: { imageUrl: true },
    }),
    db
      .select({ imageUrl: posts.imageUrl })
      .from(posts)
      .where(and(eq(posts.communityId, communityData.id), isNotNull(posts.imageUrl))),
  ]);

  await db.delete(communities).where(eq(communities.id, communityData.id));

  const keys = [
    parseForumObjectKey(community?.imageUrl),
    ...postRows.map((r) => parseForumObjectKey(r.imageUrl)),
  ].filter((k): k is string => k !== null);

  if (keys.length) {
    Promise.allSettled(keys.map((k) => deleteForumObject(k))).then((results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) {
        console.error(`[deleteCommunity] ${failed}/${keys.length} R2 deletes failed`);
      }
    });
  }
};
```

- [x] **Step 3: Update `lib/user-profile/deleteProfileImage.ts`**

```ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

export const deleteProfileImage = async (userId: string) => {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { imageUrl: true },
  });
  await db.update(users).set({ imageUrl: null, updatedAt: new Date() }).where(eq(users.id, userId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deleteProfileImage] best-effort R2 delete failed", err);
    });
  }
};
```

- [x] **Step 4: Update `lib/community/deleteCommunityImage.ts`**

```ts
import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

export const deleteCommunityImage = async (communityId: string) => {
  const existing = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { imageUrl: true },
  });
  await db.update(communities).set({ imageUrl: null }).where(eq(communities.id, communityId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deleteCommunityImage] best-effort R2 delete failed", err);
    });
  }
};
```

- [x] **Step 5: Green gate**

Run: `pnpm typecheck; pnpm test`
Expected: PASS. (Phase A tests for `deletePost` etc. were minimal — if any existing test mocks `db.query.posts.findFirst` not being called, update it; otherwise everything passes.)

- [x] **Step 6: Commit**

```bash
git add lib/posts/deletePost.ts lib/community/deleteCommunity.ts lib/user-profile/deleteProfileImage.ts lib/community/deleteCommunityImage.ts
git commit -m "feat: best-effort R2 cleanup on post/community/profile delete

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 13: Remove Phase A image stubs

**Files:**
- Delete: `lib/user-profile/uploadProfileImage.ts`, `lib/community/updateCommunityImage.ts`
- Modify: `app/actions/profile.ts`, `app/actions/community.ts`

- [x] **Step 1: Delete the stub files**

Run:
```bash
git rm lib/user-profile/uploadProfileImage.ts lib/community/updateCommunityImage.ts
```

- [x] **Step 2: Remove `profileImageAction` from `app/actions/profile.ts`**

Open `app/actions/profile.ts` and remove:
- The line `import { uploadProfileImage } from "@/lib/user-profile/uploadProfileImage";`
- The entire `export async function profileImageAction(...)` block (lines that referenced `uploadProfileImage`).

Keep `profileNameAction` and `removeProfileImageAction` untouched.

- [x] **Step 3: Remove `updateCommunityImageAction` from `app/actions/community.ts`**

Open `app/actions/community.ts` and remove:
- The line `import { updateCommunityImage } from "@/lib/community/updateCommunityImage";`
- The entire `export async function updateCommunityImageAction(...)` block.

Keep `deleteCommunityImageAction` and everything else untouched.

- [x] **Step 4: Grep for dead imports**

Run:
```bash
grep -rn "updateCommunityImageAction\\|uploadProfileImage\\b\\|updateCommunityImage\\b\\|profileImageAction" --include='*.ts' --include='*.tsx' app components hooks lib
```

Expected: zero matches. Any survivor (likely in `hooks/community/useCommunityImage.ts` which already shed the import in Task 11 — verify) must be cleaned up before commit.

- [x] **Step 5: Green gate**

Run: `pnpm typecheck; pnpm test; pnpm lint`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add app/actions/profile.ts app/actions/community.ts lib/user-profile/uploadProfileImage.ts lib/community/updateCommunityImage.ts
git commit -m "refactor: drop Phase A image stubs; confirm routes own those writes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 14: README, full green gate, manual smoke

**Files:**
- Modify: `README.md`

- [x] **Step 1: README — add R2 setup section**

In `README.md`, find the "Stack" / "Requirements" section that mentions Postgres + Better Auth (added in Phase A) and append (or replace any leftover Firebase Storage mention with):

```markdown
### Image storage — Cloudflare R2

The forum stores post images, community logos, and profile avatars in a
Cloudflare R2 bucket. To run locally:

1. Create an R2 bucket (`project-confucius-forum`) and a public custom
   domain (e.g. `https://litang.projectconfucius.id`).
2. In the Cloudflare dashboard → R2 → Manage R2 API Tokens, create a
   token scoped to that bucket with Object Read & Write.
3. Set the five `FORUM_R2_*` vars in `.env` (see `.env.example`).

Uploads use a three-step flow (`/api/upload/<surface>/presign` → PUT to
the presigned URL → `/api/upload/<surface>/confirm`), so the browser
never sees the R2 credentials.
```

(If the README still mentions Firebase Storage anywhere — grep for it — remove that wording.)

- [x] **Step 2: Full green gate**

Run: `pnpm test; pnpm typecheck; pnpm lint; pnpm build`
Expected: all PASS.

- [x] **Step 3: No-firebase grep (sanity check)**

Run: `grep -rn "firebase" --include='*.ts' --include='*.tsx' app components hooks lib atoms schema types`
Expected: zero matches (already true since Phase A; this is just a regression check).

- [x] **Step 4: Manual smoke (ask the user)**

Give the user these manual checks against the real `project-confucius-forum` bucket:

1. Sign in via central auth, open a community, click Create Post, attach an image, submit. The post page should render the image from `https://litang.projectconfucius.id/posts/<uuid>.jpg`. The object should appear in the bucket under `posts/`.
2. Profile modal → Edit → Add Image → save. Avatar updates; bucket gains a `users/<localUserId>/<uuid>.jpg`. Replace it; the old key disappears within a few seconds.
3. As a community moderator, open Community Settings → change image. New key under `communities/<communityId>/`; old key cleaned up.
4. As a non-moderator, attempt a direct POST to `/api/upload/community-image/presign` with another community's id — should get 403.
5. Delete a post that has an image. Row gone, R2 object gone (best-effort — allow a few seconds).
6. Profile modal → Delete Image. `users.imageUrl` cleared; the key disappears from R2.

- [x] **Step 5: Commit + finish**

```bash
git add README.md
git commit -m "docs: README — R2 setup; Phase B complete

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Then invoke **superpowers:finishing-a-development-branch** to choose merge/PR/cleanup.

---

## Self-review (author)

- **Spec coverage:** §2.1 module → Task 2; §2.2 key layout → Task 2; §2.3 content-type allowlist → Task 2 (in `ALLOWED_CONTENT_TYPES`) reused by routes in Tasks 4/5/6; §2.4 env vars → Task 1; §3 upload flow + §3.1 authz → Tasks 4/5/6; §3.2 post upload sequencing → Task 9; §4 replace+delete cleanup → Tasks 5/6/12; §5 `useSelectFile` change → Task 7; §6 file list → exactly matches the "File structure" section above; §7 tests → present in every relevant task (storage Task 2, presign/confirm Tasks 4/5/6, client helper Task 8, hook Task 7); §8 packages → Task 1; §9 non-goals → naturally satisfied by not introducing any of them; §10 notes for future → no implementation needed. All spec sections mapped.
- **Placeholder scan:** No "TBD", "TODO", or "similar to" — every code-bearing step has the actual code. The one "implementer note" in Task 6 Step 5 is a refactor instruction, not a placeholder, and is followed by an explicit description of the merge.
- **Type consistency:** `uploadImage(surface, blob, surfaceId?)` shape in Task 8 matches its callers in Tasks 9 (`uploadImage("post-image", blob)`), 10 (`uploadImage("profile-image", blob)`), and 11 (`uploadImage("community-image", blob, communityData.id)`). `selectedBlob` field in Task 7 matches the destructure in Tasks 9–11. `isModerator(userId, communityId)` introduced in Task 3 is consumed verbatim in Task 5. `parseForumObjectKey` / `deleteForumObject` introduced in Task 2 are consumed in Tasks 5/6/12. `MAX_IMAGE_BYTES = 10MB` matches `useSelectFile`'s existing `maxImageSize = 10` and matches the spec.
- **Scope:** Phase B only; image processing, migration, cleanup jobs, and UI re-skin are all explicitly out of scope (spec §9). The plan touches no Phase C/D/E concerns.
