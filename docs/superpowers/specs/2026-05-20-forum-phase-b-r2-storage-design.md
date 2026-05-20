# Forum De-Firebase — Phase B: Image storage on Cloudflare R2

**Date:** 2026-05-20
**Repo:** `projectconfucius-forum` ("Circus Discussions" / "litang")
**Status:** Design approved, ready for plan
**Predecessor:** Phase A (2026-05-19) — merged to `main` via PR #1

## 1. Context & goal

Phase A removed Firebase Auth / Firestore / Functions, swapped the data layer
to Postgres + Drizzle + sibling Better Auth, and stubbed out the three image
upload surfaces (post images, community logos, profile avatars): the server
actions accept an already-resolved `imageUrl` string, the `useSelectFile` hook
produces a base64 data URL that currently goes nowhere, and `firebase` is no
longer in `package.json`.

Phase B wires those three surfaces to **Cloudflare R2** following the house
pattern already established in `projectk` (`lib/storage/r2-*.ts` plus
`presign` / `confirm` route pairs). The R2 bucket is already provisioned by
the user:

- Bucket name: `project-confucius-forum`
- Public URL: `https://litang.projectconfucius.id`
- Account ID: `e170f29c3780e7a07f8119776f0a5fae`
- API token: created in the Cloudflare dashboard scoped to this bucket
  (Object Read & Write), credentials placed in `.env`.

**Phase B done when:** the three image surfaces upload to and read from R2
end-to-end; replace and entity-delete clean up the old objects best-effort;
the green gate (`pnpm test; pnpm typecheck; pnpm lint; pnpm build`) passes;
no `firebase` package or `firebase/storage` reference remains anywhere.

Decisions locked during brainstorming:

- **No server-side image processing.** `useSelectFile` already validates
  type/size/dimensions and re-encodes via canvas; what the client uploads is
  what R2 stores. No thumbnails, variants, EXIF stripping, or format
  normalization — those are not on the roadmap.
- **One bucket, three top-level prefixes** (`posts/`, `communities/`,
  `users/`). All three categories are public-read images with the same size
  ceiling and a similar lifecycle; a single bucket keeps env config and ops
  simple.
- **Random `fileId` per upload, never overwrite at the key level.** Replacing
  a community logo or profile picture writes a new key; the old key is
  deleted best-effort after the DB update. Trivial cache-busting, safe
  rollback if a delete fails.
- **Best-effort cleanup.** R2 delete failures never block a user-facing
  action; orphans are tolerated. A future cleanup job is out of Phase B
  scope.
- **No Firestore-era image migration.** Phase A used a fresh DB, so there
  are no legacy `firebasestorage.googleapis.com` URLs to rewrite.

## 2. Architecture

### 2.1 Storage module: `lib/storage/r2-forum.ts`

Mirrors `projectk/lib/storage/r2-music.ts`. Exports:

- An `S3Client` configured for R2
  (`https://${accountId}.r2.cloudflarestorage.com`, `region: "auto"`), with
  credentials from `FORUM_R2_*` env vars, falling back to shared `R2_*`
  vars (the same fallback convention projectk uses, in case the user
  consolidates credentials later).
- `generateForumPresignedPutUrl(key, contentType, expiresIn?)` — wraps
  `getSignedUrl(client, new PutObjectCommand(...))`, default 1 hour.
- `forumObjectExists(key)` — `HeadObjectCommand`; returns `boolean`. Used by
  confirm routes to refuse confirmation when the client never actually
  uploaded.
- `deleteForumObject(key)` — `DeleteObjectCommand`; no-throws via
  `try/catch` at the call site (the module itself throws; callers wrap).
- `getForumPublicUrl(key)` — `${FORUM_R2_PUBLIC_URL}/${key}` (no trailing
  slash on the env var — confirmed with the user).
- `parseForumObjectKey(publicUrl) → key | null` — inverse of
  `getForumPublicUrl`. Used by replace/delete flows to derive the old key
  from the `users.imageUrl` / `communities.imageUrl` / `posts.imageUrl`
  value already in the DB. Returns `null` for URLs that are not on our
  public host (defensive: legacy or external URLs are skipped, not thrown).

### 2.2 Key layout

Three key-builders, each returning a stable, predictable shape:

- `postImageKey(fileId, ext) → posts/{fileId}.{ext}`
  - Posts use only a random fileId (no `postId` prefix) because the post
    row doesn't exist at presign time. The post is created **after** the
    upload succeeds, with the public URL passed into `createPostAction`.
- `communityImageKey(communityId, fileId, ext) → communities/{communityId}/{fileId}.{ext}`
- `userImageKey(userId, fileId, ext) → users/{userId}/{fileId}.{ext}`

`fileId = crypto.randomUUID()`. `ext` is derived from the file's MIME type
on the server (not from the filename, to avoid trusting client input):
`image/jpeg → jpg`, `image/png → png`, `image/gif → gif`. Unknown types
are rejected at presign time with 400.

### 2.3 Allowed content types & size cap

Matches the existing `useSelectFile` allowlist exactly:

- Allowed: `image/jpeg`, `image/png`, `image/gif`
- Max size: 10 MB (already enforced client-side; the presign route encodes
  it in the returned `maxSize` for the client uploader to double-check, and
  the public URL doesn't permit larger uploads because the presigned URL
  is bound to the exact ContentType at presign time).

No `image/webp` for now — the existing `useSelectFile` canvas output is
JPEG, and adding webp now would be a UI behavior change out of scope.

### 2.4 Env vars

```
FORUM_R2_ACCOUNT_ID=e170f29c3780e7a07f8119776f0a5fae
FORUM_R2_ACCESS_KEY_ID=...
FORUM_R2_SECRET_ACCESS_KEY=...
FORUM_R2_BUCKET_NAME=project-confucius-forum
FORUM_R2_PUBLIC_URL=https://litang.projectconfucius.id
```

The module throws at first use if `FORUM_R2_BUCKET_NAME` or
`FORUM_R2_PUBLIC_URL` is missing, mirroring the existing `DATABASE_URL` /
`AUTH_DATABASE_URL` pattern in `lib/db/*`. Tests provide these via
`vitest.setup.ts` (per memory `reference_vitest_env_loading`: vitest does
not auto-load `.env`).

## 3. Upload flow

Same three-step shape for all three surfaces; only the key-builder and the
DB write differ.

```
[client]
  useSelectFile → File object (validated: type, size, dimensions)
    │
    │  1. POST /api/upload/<surface>/presign
    │       body: { contentType, fileName, surfaceId? }
    │       → server: requireUser() + per-surface authz
    │       → 200: { presignedUrl, key, publicUrl, maxSize }
    │       → 4xx: 401 unauth / 400 bad content-type / 403 not authorized
    │
    │  2. PUT presignedUrl  (binary file body, Content-Type matches presign)
    │       → R2
    │
    └  3. POST /api/upload/<surface>/confirm
            body: { key, surfaceId? }
            → server: requireUser() + per-surface authz + HeadObject(key)
            → DB update via the existing Phase A action internals
            → 200: { imageUrl }
            → 4xx: 401 / 403 / 400 if HeadObject misses
```

The client helper `lib/upload/uploadImage.ts` orchestrates all three steps
in one call so the three consumer components don't each duplicate the
fetch dance:

```ts
uploadImage(surface, file, surfaceId?) → { imageUrl }
```

`surface` is one of `"post-image" | "community-image" | "profile-image"`.
The helper **throws** on any non-2xx step (presign 4xx, R2 PUT non-2xx, or
confirm 4xx). The three consumer components already use `useCustomToast`
for error display — they wrap the `uploadImage` call in `try/catch` and
toast the error message, matching how the current Phase A submit paths
handle action failures.

### 3.1 Per-surface authz

All three routes call `requireUser()` to get the local `userId` first.

- **Post image:** any authenticated user. The presign route does not need
  to know `communityId` because the same key is valid for any post; the
  community-membership check happens at the existing `createPostAction`
  layer.
- **Community logo:** the caller must be a moderator of `surfaceId`
  (`communityId`). The confirm route re-checks moderator status before
  writing — never trust authz from the client-side that called presign.
- **Profile image:** self-only. `userId` is taken from the session, never
  from the request body. There is no `surfaceId` parameter.

Authz is **re-checked at confirm**, not just at presign — presign +
upload to R2 happens client-side and a determined caller could replay a
stale presign URL after authz state changes.

### 3.2 New post upload sequencing

The post row doesn't exist at presign time. Sequence:

1. User picks image → `useSelectFile` validates.
2. User clicks Submit → `NewPostForm` (a) calls
   `uploadImage("post-image", file)` which presigns + uploads + confirms;
   the confirm route does only a HeadObject check and returns the public
   URL (no DB write for posts — there's nothing to write to yet). Then
   (b) calls `createPostAction(..., imageUrl)` with the returned URL.
3. If step 2b fails (post creation rejected), step 2a's object becomes an
   orphan. Acceptable per the locked decision; cleanup is out of scope.
4. If the user cancels between picking the image and submitting, no
   upload has happened yet — the picked file is just in browser memory.
   So this orphan window only exists when the user uploads but the post
   create itself fails server-side.

## 4. Replace and delete cleanup

Best-effort, wrapped in `try/catch`; failure logs but does not surface to
the user. Three cases:

### 4.1 Replace

Profile / community confirm routes:
1. Read existing `users.imageUrl` / `communities.imageUrl`.
2. Run `parseForumObjectKey(oldUrl)` — null for empty / external URLs.
3. Write the new `imageUrl`.
4. If the parse returned a key, fire-and-forget `deleteForumObject(key)`.

The DB write happens **before** the R2 delete so a delete failure can
never leave the row pointing at a missing object.

### 4.2 Entity delete

- `deletePost(postId)` — fetch `posts.imageUrl` before the DB delete;
  after the cascade delete commits, best-effort `deleteForumObject` if a
  key was parsed.
- `deleteCommunity(communityId)` — fetch all post imageUrls in the
  community plus the community's own imageUrl, then cascade delete, then
  `Promise.allSettled` the R2 deletes. Counts surface in the log; failures
  do not bubble up.
- `deleteProfileImageAction` — same shape as Replace but writes `null`
  instead of a new URL.

User-account deletion is not a forum-level concern (no UI for it; the
auth row is owned by `projectconfucius-auth`). Out of scope.

## 5. `useSelectFile` change

Today, `useSelectFile` (a) validates type/size, (b) validates dimensions,
(c) re-encodes via a canvas to a JPEG data URL, (d) exposes only the data
URL string. The data URL is convenient for in-form preview but useless
for the wire (~33% inflation, can't be PUT to a presigned URL directly).

The change: expose the **`File`** (or `Blob`) too. The simplest shape that
doesn't break existing call sites:

```ts
{
  selectedFile: string | undefined;   // unchanged — data URL for <Image src>
  selectedBlob: Blob | undefined;     // new — what gets PUT to R2
  setSelectedFile: (s: string | undefined) => void;
  onSelectFile: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

The canvas re-encode produces a JPEG `Blob` (via `canvas.toBlob`) in
parallel with the existing data URL. Both are set in the same `onload`
callback. The three consumer components import the new `selectedBlob`
field; the existing `selectedFile` (data URL) consumers keep working
unchanged for preview.

The hook also needs to clear `selectedBlob` when `setSelectedFile` is
called with `undefined` (cancel selection). Minor but real.

## 6. Files created / modified / removed

### Created

- `lib/storage/r2-forum.ts` — R2 client + key-builders + helpers
- `lib/upload/uploadImage.ts` — client orchestration helper
- `app/api/upload/post-image/presign/route.ts`
- `app/api/upload/post-image/confirm/route.ts`
- `app/api/upload/community-image/presign/route.ts`
- `app/api/upload/community-image/confirm/route.ts`
- `app/api/upload/profile-image/presign/route.ts`
- `app/api/upload/profile-image/confirm/route.ts`
- `tests/storage/r2-forum.test.ts`
- `tests/api/upload-presign.test.ts`
- `tests/api/upload-confirm.test.ts`
- `tests/upload/uploadImage.test.ts`

### Modified

- `hooks/useSelectFile.tsx` — add `selectedBlob` (Blob via `canvas.toBlob`)
- `components/posts/new-post-form/NewPostForm.tsx` — submit pipeline calls
  `uploadImage("post-image", blob)` before `createPostAction`
- `components/modal/profile/ProfileModal.tsx` — call `uploadImage`, then
  the new profile-image confirm has already written the row, so the modal
  just refreshes session state
- `components/modal/community-settings/CommunitySettings.tsx` — same
  shape, calls `uploadImage("community-image", blob, communityId)`
- `lib/posts/deletePost.ts` — fetch imageUrl before delete; best-effort
  R2 cleanup after the row is gone
- `lib/community/deleteCommunity.ts` — same pattern, fan-out for all
  post images plus community logo
- `app/actions/profile.ts` — `profileImageAction` (the Phase A URL-string
  stub) is **removed** because the new `/api/upload/profile-image/confirm`
  route owns that write; `removeProfileImageAction` is kept and extended
  to do the R2 delete after the DB clear
- `app/actions/community.ts` — `updateCommunityImageAction` (Phase A
  URL-string stub) is **removed** for the same reason; the new
  `/api/upload/community-image/confirm` owns the write.
  `deleteCommunityImageAction` is kept and extended to do the R2 delete
- `lib/user-profile/uploadProfileImage.ts` and
  `lib/community/updateCommunityImage.ts` (the Phase A stub wrappers
  around a one-line `db.update`) are deleted; their callers move to the
  confirm route. `deleteProfileImage` / `deleteCommunityImage` stay and
  gain the R2 delete
- `.env.example` — add the five `FORUM_R2_*` vars
- `vitest.setup.ts` — env loading already wired in Phase A; if any new
  test needs an additional setup helper, add here
- `package.json` — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `README.md` — replace any remaining "Firebase Storage" reference with
  the R2 setup section

### Removed

- Nothing. Firebase Storage code was already excised in Phase A. A final
  grep at the end (Task N green gate) confirms no `firebase` /
  `firebasestorage` strings linger.

## 7. Tests

Vitest only (no Playwright/e2e). Three layers:

### 7.1 Unit — storage module

`tests/storage/r2-forum.test.ts`:

- Key-builders return the exact documented shapes (`posts/<uuid>.<ext>`,
  `communities/<id>/<uuid>.<ext>`, `users/<id>/<uuid>.<ext>`) given a
  fixed uuid + ext. Regression guard on the URL format.
- `getForumPublicUrl` joins host + key with exactly one slash.
- `parseForumObjectKey(getForumPublicUrl(k))` round-trips to `k`;
  external URLs return `null`; empty string returns `null`.

### 7.2 Route — presign

`tests/api/upload-presign.test.ts` — one suite per surface:

- Unauthenticated request → 401.
- Wrong content-type → 400 with the allowed-types message.
- Community-logo with non-moderator caller → 403.
- Profile-image: any field that tries to override userId is ignored
  (assert the returned key is under `users/<sessionUserId>/`).
- Happy path: 200 with `{ presignedUrl, key, publicUrl, maxSize }`. The
  S3 client is mocked; the test asserts shape, not signature validity.

### 7.3 Route — confirm

`tests/api/upload-confirm.test.ts` — per surface:

- HeadObject misses → 400.
- Authz fails at confirm even if it passed at presign (re-check) → 403.
- Profile-image happy path: writes `users.imageUrl`; if there was a
  previous image, `deleteForumObject` is called once on the old key.
- Community-logo happy path: same shape with `communities.imageUrl` and
  moderator authz.
- Post-image confirm returns `{ imageUrl }` and **does not** touch the
  DB (no post row to write to yet).

### 7.4 Unit — client helper

`tests/upload/uploadImage.test.ts`:

- Calls presign, PUTs to the returned URL, calls confirm, returns the
  imageUrl. `fetch` is mocked; assert call sequence and request bodies.
- Surfaces error from any of the three steps with a useful message.

### 7.5 Manual smoke (user-driven, after green gate)

- Sign in via central auth, navigate to a community, submit a post **with
  an image** → object appears in `project-confucius-forum/posts/`, post
  renders the image from `litang.projectconfucius.id/posts/<uuid>.jpg`.
- Profile modal → change avatar → old key disappears, new key appears.
- Community settings → moderator changes the logo → same shape.
- Community settings → non-moderator attempts a presign call directly →
  403.
- Delete a post that has an image → row gone, R2 object gone within a
  few seconds (best-effort, so allow a small lag in the dashboard).

## 8. Packages & tooling

- Add: `@aws-sdk/client-s3@^3.1020.0`, `@aws-sdk/s3-request-presigner@^3.1020.0`
  (versions matching projectk for cross-app consistency).
- No removals (firebase already gone in Phase A).
- pnpm only — `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`.

### Phase B done = green gate

`pnpm test`, `pnpm typecheck` (`pnpm exec tsc --noEmit`), `pnpm lint`,
`pnpm build` all pass. Manual smoke (§7.5) passes against the real bucket.
A repo-wide grep for `firebase` returns nothing in source.

## 9. Non-goals

- No image processing (no resize, no thumbnails, no variants, no EXIF
  stripping, no format normalization).
- No Firebase Storage data migration.
- No cleanup job / cron for orphaned objects.
- No new image features beyond Phase A's UI (no album-style multi-image
  posts, no GIF auto-conversion, no video).
- No UI redesign (still faithful to the original — Phase D's job).
- No related refactor of unrelated code touched only incidentally.

## 10. Notes for future phases

- The existing `useSelectFile` hard-codes a JPEG re-encode in canvas. PNG
  uploads end up as JPEGs at the wire. This is **existing behavior** —
  out of scope for Phase B. If a faithful Phase D re-skin reveals it as
  a regression, address there.
- A periodic R2 cleanup job (sweep keys whose URLs are not referenced by
  any `posts.imageUrl` / `communities.imageUrl` / `users.imageUrl`) would
  reclaim the orphans tolerated by best-effort cleanup. Not Phase B; pick
  up if storage costs ever justify it.
