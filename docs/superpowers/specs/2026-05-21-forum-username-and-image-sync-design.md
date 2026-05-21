# Plan 2 — Forum username & image sync (design)

Status: approved 2026-05-21. Implementation pending (see corresponding plan file).

## Summary

Mirror the Better Auth user's `username` and `image` into the forum's local `users` table, propagate username into the denormalized display caches on posts and comments (Reddit-style: set at write time, never rewritten), and push forum-side image edits back to auth via the Plan 1b `PATCH /api/user/image` endpoint. After this plan, every new post/comment shows `u/<username>` and the forum keeps its existing profile-edit surface while auth remains the central identity store.

This plan strictly depends on Plan 1 (auth-side) being deployed first: the `username` field must be on the session payload, and the `/api/user/image` endpoint must accept the forum origin.

## Motivation

- Today `posts.creatorUsername` and `comments.creatorDisplayText` hold whatever `displayName(session.user)` returned (name or email-prefix). The contract lies and the UI cannot render real `u/<username>` handles.
- The forum has its own `users.imageUrl` and R2 upload flow. Edits in the forum profile modal don't propagate to auth, so other sibling apps that read `session.user.image` see stale data.
- Plan 3 (members-only admin picker) needs a real `users.username` column to render and search against.

## Out of scope

- Plan 3 admin picker UI — separate spec.
- Rewriting historical posts/comments with usernames after the fact. Set-at-write semantics; old rows go to `u/deleted`.
- A one-shot script to backfill forum username from auth for ALL existing users — done lazily at provisioning time. The cost is one extra second on first sign-in per user post-deploy.
- Showing both display name and `u/<username>` together. Username-only.
- Letting the forum edit anything other than image (e.g. username changes via forum UI).

## Architecture

Three flows:

- **Pull (auth → forum)** at `provisionLocalUser` time: copy `session.user.username` and `session.user.image` into the local row. Username is always synced (drift-correct on every hit). Image is synced ONLY when local row's `imageUrl` is null — otherwise the forum is the write authority and we trust local. New inserts and email-relinks always set both fields.
- **Push (forum → auth)** at two image write sites (`profile-image/confirm` route and `deleteProfileImage`): after local DB update, best-effort PATCH the auth user's image. Failure logs but does not fail the request — auth is eventually consistent next time the user edits or signs in.
- **Fanout (forum local → forum caches)**: none required for username. `creatorUsername` and `creatorDisplayText` are frozen at write time. The existing `updateUserPostsName` / `updateUserCommentsName` rewriters are deleted, and `profileNameAction` stops invoking them — name changes no longer ripple into display caches.

### Schema changes

```sql
-- users: add nullable username (mirrors auth)
ALTER TABLE users ADD COLUMN username text UNIQUE;

-- posts: allow null + null-out legacy display values
ALTER TABLE posts ALTER COLUMN creator_username DROP NOT NULL;
UPDATE posts SET creator_username = NULL;

-- comments: same treatment
ALTER TABLE comments ALTER COLUMN creator_display_text DROP NOT NULL;
UPDATE comments SET creator_display_text = NULL;
```

After this, both display columns mean: "real username at write time, or NULL = tombstone (render `u/deleted`)".

This deliberately nukes historical display attribution. The trade was accepted at brainstorm: cleaner invariant beats lossy migration logic. Take a database backup before running.

### Provisioning + session wire-up

`lib/auth/provision.ts` gains two inputs and one rule:

```ts
provisionLocalUser({
  authUserId: string;
  email: string;
  name: string;
  username: string | null;   // new
  image: string | null;       // new
}): Promise<{ id: string }>
```

Behavior per path:
- **Insert**: write all five fields including username and image.
- **Relink by email** (existing row found by email, missing authUserId): update authUserId, name, username, image — latest sign-in wins.
- **Hit by authUserId** (existing row found by authUserId): update username if drifted; update image ONLY if local is null and incoming is non-null.

`lib/auth/session.ts:requireUser` passes `session.user.username` and `session.user.image` through.

`app/api/upload/profile-image/confirm/route.ts:19-23` inlines its own `provisionLocalUser` call — same arg update.

### Username display contract

`posts.creatorUsername` and `comments.creatorDisplayText` are nullable caches holding the user's real username at write time. They are never rewritten on later renames.

**Write sites:**
- `lib/posts/createPost.ts`: stores `author.username ?? null`.
- `app/actions/posts.ts:createPostAction`: replace `displayName(session.user)` with `session.user.username ?? null`. Delete the `displayName` helper.
- Comments create path (locate during implementation; likely `lib/comments/createComment.ts`): pass `session.user.username ?? null`.

**Read sites:**
Single helper `lib/user-profile/formatUserHandle.ts`:
```ts
export function formatUserHandle(username: string | null | undefined): string {
  return `u/${username ?? "deleted"}`;
}
```
Used by:
- `components/posts/post-item/PostDetails.tsx:22` — `By ${formatUserHandle(post.creatorUsername)}`.
- `components/navbar/SearchModal.tsx:198` — same.
- Comment display sites — same.

**Removals:**
- `lib/user-profile/updateUserPostsName.ts` — deleted; `profileNameAction` stops calling it.
- `lib/user-profile/updateUserCommentsName.ts` — deleted; same.
- `displayName()` helper in `app/actions/posts.ts` — deleted.

### Image sync

**Push (forum → auth)** via new helper `lib/auth/patchAuthUserImage.ts`:

```ts
export async function patchAuthUserImage(
  reqHeaders: Headers,
  image: string | null
): Promise<void> {
  const cookie = reqHeaders.get("cookie") ?? "";
  const url = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/user/image`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) {
      console.error("[patchAuthUserImage] non-2xx", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[patchAuthUserImage] fetch failed", err);
  }
}
```

Called from:
- `app/api/upload/profile-image/confirm/route.ts` after `db.update(users).set({ imageUrl: newUrl, ... })`.
- `lib/user-profile/deleteProfileImage.ts` after `db.update(users).set({ imageUrl: null, ... })` — but `deleteProfileImage` needs to receive request headers, so the call site changes too. Cleanest: pass `reqHeaders` through, or move the auth push into the action layer (`removeProfileImageAction` in `app/actions/profile.ts`) which has access to headers via `requireUser`/`headers()`.

The auth user's cookie is forwarded so the auth side authenticates the session. Best-effort: forum DB is already updated; failures are logged.

**Pull (auth → forum)** is built into `provisionLocalUser` per the rules above:
- Username: unconditional sync on every path.
- Image: only set when local is null (insert / first-time relink / hit-with-empty-local).

## Coordination with auth-side Plan 1

Hard dependencies on auth-side state at deploy time:
- `session.user.username` must be present on session payload (Plan 1 Step 0).
- `session.user.image` already exists (Better Auth default).
- `PATCH /api/user/image` endpoint must accept the forum origin (CORS allowlist) and accept the user's cookie.

If the auth side ships first and the forum hasn't deployed, no break — old forum keeps working. If the forum side ships first, the push helper logs errors but the forum DB stays current; consumers of `session.user.username` get null until auth catches up.

## Testing strategy

- **Unit** (vitest):
  - `formatUserHandle`: null → `u/deleted`, "alice" → `u/alice`, undefined → `u/deleted`.
  - `provisionLocalUser`: 3 paths × {image present locally, image null locally} × {username drift, no drift}. Assert image-when-empty rule, username always synced.
- **Integration** (vitest with test DB):
  - `createPost` writes `session.user.username` into `creatorUsername`.
  - `profileNameAction` updates `users.name` but does NOT touch `creatorUsername` or `creatorDisplayText`.
  - `profile-image/confirm` route updates local imageUrl AND calls auth PATCH (fetch mocked, assert URL + cookie header forwarded + body).
  - `removeProfileImageAction` updates local imageUrl to null AND calls auth PATCH with `{ image: null }`.
- **Render**: UI sites that switched to `formatUserHandle` get a small snapshot or assertion test confirming `u/<username>` shape.
- **Manual smoke**:
  - Fresh sign-in on forum after editing image in another app → first provisioning pulls image into forum.
  - Create post → `creatorUsername` matches `session.user.username`.
  - Create comment → same.
  - Edit profile name in forum → posts/comments display unchanged (frozen).
  - Upload new image in forum → auth user's image updates (verify via auth admin or another app).
  - Delete image in forum → auth user's image clears.

## Risks

- **Auth-side endpoint not deployed yet**: forum push 404s. Best-effort design tolerates this; coordinate deploy order (auth Plan 1 → forum Plan 2).
- **Cross-subdomain cookie not forwarded by server-side fetch**: the cookie header is explicitly forwarded, but verify in a real browser session that the auth side accepts it (cookie domain `.projectconfucius.id` should make this work; same shared-cookie setup that powers SSO). Test on preview before prod.
- **Session staleness on image pull**: a user who edits image in the forum and then signs in on a new device may briefly see the old image (the session cookie returned was issued before the auth-side DB update). Tolerable — corrects on next session refresh.
- **Destructive migration**: `UPDATE posts SET creator_username = NULL` and the equivalent for comments cannot be undone without a backup. The implementation plan must call this out and require backup before run.
- **Comment write path**: I haven't yet located the comment-creation server function. The plan must include "locate it, then mirror the post change" as an explicit task.

## Downstream

- Plan 3 (admin picker): needs `users.username` searchable and displayed `u/<name>`. Plan 2 makes both possible.
- Future: a one-shot backfill script for forum username could be written if lazy-at-provision creates support friction. Not planned.
