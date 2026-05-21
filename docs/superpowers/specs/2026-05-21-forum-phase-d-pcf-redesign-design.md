# Forum De-Firebase — Phase D: PCF redesign (Chakra → shadcn, Mountain Jade)

**Date:** 2026-05-21
**Repo:** `projectconfucius-forum`
**Status:** Design approved, spec under user review
**Branch (target):** `feat/phase-d-pcf-redesign`

## 1. Context & goal

Phases A–C of the forum de-Firebase migration are complete on `main` (Postgres + Drizzle + sibling Better Auth, Cloudflare R2 storage, TanStack Query state). The presentation layer is still Chakra UI v3 + Emotion + an unused framer-motion 12.x. Phase D removes those, replaces them with **shadcn + Tailwind v4 + `motion` (the renamed framer-motion)**, and uses the migration as the occasion to do a **creative redesign**, not a faithful re-skin — a substantive scope shift from the goal sketched in the Phase A spec.

The redesign locks a new visual language ("Mountain Jade · Considered Modern"), fixes the worst UX gripe in the current product (the deceptive "create post" flow), introduces overlay-style post detail with shared-element morphs, and adds Reddit-style comment threading with depth cutoff + permalinkable sub-threads. The app is also renamed from "Circus" / `next_discussion_platform` to **projectconfucius forum** (`PCF` in tight slots).

Decisions locked during brainstorming:
- **Migrate to shadcn**, not stay on Chakra — consistency with sibling apps (`makinsegar-app`, `formdataumat`, `projectconfucius-auth`), removal of Emotion's SSR-registry complexity, and Chakra v3's compound API maps almost 1:1 to shadcn/Radix.
- **Mountain Jade palette** on cool slate neutrals, with clay-rose downvote (no red).
- **Inter** (UI/body) + **Source Serif 4** (titles, attributions) via `next/font`.
- **Considered Modern** animation language — spring-ish micro-interactions, no AI-slop gradients/glow-storms.
- **Tier 3 restructure scope** — visual + IA + layout reflow. Modals-as-modals only where modals genuinely fit; everything else becomes pages.
- **Pattern A inline-expand composer** replacing the deceptive fake-input + `/submit` page.
- **Shared-element morph + Next.js intercepting routes** for post detail (feed stays mounted behind an overlay; URL still real and shareable).
- **5 inline comment depth + Continue-this-thread sub-route**.
- **App rename:** `projectconfucius forum` (long), **`PCF`** (short).

This spec covers Phase D only. Phase E folds into D — UI is the terminal phase of the migration.

## 2. Visual language

### 2.1 Palette — Mountain Jade

Cooler, crisper jade than the current emerald `#10b981`. Cool slate neutrals (warmer would have read more "library", we picked cooler for distinctiveness). Clay-rose downvote complement instead of red.

| Token | Light | Dark |
|---|---|---|
| `--primary` (jade) | `#2A8C82` | `#3FA89C` |
| `--primary-foreground` | `#FFFFFF` | `#0B2724` |
| `--primary-deep` (hover) | `#1C685E` | `#2A8C82` |
| `--primary-soft` (focus rings, jade-50/200) | `#E4F1EF` / `#9CD9D1` | rgba jade tints |
| `--background` (page canvas) | `#EEF1F2` | `#0F1E1C` |
| `--surface` (cards) | `#FFFFFF` | `#152826` |
| `--border` | `#E3E8E8` | `#1A2E2B` |
| `--text` | `#101A1A` | `#E7EEED` |
| `--text-soft` | `#4C5957` | `#9AA6A4` |
| `--text-mute` | `#8A9694` | `#6C7A7A` |
| `--destructive` / downvote (clay) | `#A45656` | `#D08585` |

Tokens live in `app/globals.css` mapped onto shadcn's semantic naming (`--background`, `--foreground`, `--primary`, `--accent`, etc.) so the migration is idiomatic shadcn, not "Tailwind with arbitrary colors". `next-themes` (already present) toggles the `.dark` class on `<html>`.

### 2.2 Typography

- **`Inter`** for UI and body. Variable font, weights 400/500/600/700/800. Loaded via `next/font/google` with `display: "swap"`, exposed as CSS variable `--font-sans` and Tailwind `font-sans`.
- **`Source Serif 4`** for post titles, the post-detail body when displayed editorially, and attribution lines (`u/handle` rendered as serif italic — reads like a quoted attribution). Variable font, optical-size enabled. Exposed as `--font-serif` and Tailwind `font-serif`.
- Old `@fontsource/open-sans` removed in Phase 8.

### 2.3 Animation vocabulary

- **Spring** (cubic-bezier `(.2, .7, .3, 1.4)`) for "playful" interactions: vote-pop, button press, +1 ghost.
- **Smooth** (cubic-bezier `(.2, .7, .3, 1)`) for layout transitions: composer expand/collapse, panel slides, comment fade-in.
- Durations: 150–250 ms for micro-interactions, 320–420 ms for layout changes, 380 ms for cross-route slide.
- **Forbidden:** purple/pink gradients, glassmorphism, glow storms, neon outlines, floating particles. Single-element subtle effects only.

## 3. Information architecture & routing

| Purpose | Current | New |
|---|---|---|
| Community feed | `/community/[id]` | `/c/[id]` |
| Post detail | `/community/[id]/comments/[pid]` | `/c/[id]/posts/[pid]` |
| Sub-thread (Continue this thread →) | _(none)_ | `/c/[id]/posts/[pid]/comment/[cid]` |
| Submit post | `/community/[id]/submit` | **deleted** (inline composer replaces) |
| Profile | _(modal)_ | `/settings/profile` |
| Saved posts | _(modal)_ | `/saved` |
| Community settings (multi-section modal) | _(modal)_ | `/c/[id]/settings` (Tabs: general / privacy / image / admins / danger) |
| Community members | _(modal)_ | `/c/[id]/members` |
| Communities directory | `/communities` | `/communities` (kept) |

Old `/community/[id]/*` routes get permanent 308 redirects to the new `/c/[id]/*` equivalents so external links keep working.

**Modals retained** (genuine fits): `ConfirmationDialog`, `ImageCropModal`, `CreateCommunityModal`, the Cmd-K search overlay.

**Layout shell:**
- Desktop: two-column. Feed max 720 px, sidebar 280 px. Sidebar **always present** on `/` and `/c/[id]` (currently only on community pages).
- Sidebar contents shift by route: home shows "Your communities" (with active-dot indicator) + "Discover" + a rotating community-quote card. Community page shows community about + moderators + similar communities.
- Mobile (<768 px): sidebar collapses into a left-edge shadcn `<Sheet>` summoned by a hamburger.
- Navbar: logo glyph + "PCF" wordmark + search trigger (opens Cmd-K) + "+" button (opens modal composer when not on a community page) + user menu.

**Intercepting routes for the post-detail overlay:**
- `app/c/[id]/posts/[pid]/page.tsx` — the real page (direct loads, shared URLs).
- `app/c/[id]/@modal/(.)posts/[pid]/page.tsx` — intercepting route, renders the same `<PostDetail>` as an overlay over the community feed.
- The `@modal` parallel route slot lives in `app/c/[id]/layout.tsx` alongside `children`.

## 4. Core interaction patterns

### 4.1 Inline-expand composer

Replaces the deceptive `CreatePostLink` (fake-input that hijacks click to navigate to `/submit`).

- Lives at the top of every community feed (`/c/[id]`). On `/` (home), shown only if the user is signed in **and** is a member of at least one community.
- **Closed state:** 56 px pill, "Start a discussion in c/[name]…" + image / link quick-icons + the user's avatar.
- **Open state:** max-height transition (320 ms, smooth easing). Reveals tabs (Text / Image / Link), title input (Source Serif 4, no border, large), body textarea, footer with posting-to indicator + character count + Cancel/Post.
- **Submit:** `useCreatePost` mutation → optimistic insert at top of feed → 3-second jade-glow keyframe on the new card (jade border + jade-50 box-shadow that fades to default).
- **Restricted community** (current user can't post): pill replaced with `<RestrictedComposerNotice>` of the same height — muted styling, "Members only" copy + Join button.
- **Modal variant:** triggered from the navbar "+" button when not on a community page. Renders inside a shadcn `<Dialog>` with a community-picker `<Combobox>` at the top.
- **Keyboard:** `Ctrl/Cmd + Enter` submits, `Esc` collapses.

### 4.2 Post-detail transition (intercepting routes + View Transitions API)

- `<Link href={`/c/${id}/posts/${pid}`}>` from the feed → Next.js intercepts → renders the overlay (`@modal/(.)posts/[pid]/page.tsx`).
- Each post card sets `style={{ viewTransitionName: `post-${pid}` }}` on the outer container; the vote rail and title set `vote-${pid}` and `title-${pid}`. The detail page applies the same names to its corresponding elements. Browser handles the FLIP morph.
- Wrapped in `unstable_ViewTransition` (Next.js 16). Graceful Firefox fallback: 220 ms `transition-opacity` crossfade.
- ESC, the back-button arrow, and browser-back all close the overlay and reverse the animation. The feed scroll position is preserved exactly.
- Direct URL load → renders the full `page.tsx` (not the overlay), with the same `viewTransitionName`s, so navigating back internally still morphs.

### 4.3 Comment threading (Reddit-style)

- Server component fetches top-level comments with up to 5 inline depth, first 8 siblings per level. Cached in TanStack Query under `["comments", postId]`.
- `<CommentNode>` is recursive. Renders comment + actions + (if `depth < 5`) `<CommentChildren>`. At `depth === 5`, renders `<ContinueThreadButton>` linking to `/c/[id]/posts/[pid]/comment/[cid]`.
- **Spine-click handler:** the 2 px jade vertical line to the left of each subtree is clickable; toggles a local collapse state. Collapsed renders `<RepliesSummary count={n}>` pill ("+ N replies") next to the author.
- **"Show more replies"** button at the end of a level lazy-loads the next page of siblings via `useInfiniteQuery` with cursor pagination.
- **Sub-thread route** (`/comment/[cid]`): same `<CommentNode>` used as root, with depth budget reset to 0. The route is fully permalinkable. Recursive if needed.
- **Sub-thread transition:** slides in from the right (380 ms `(.2,.7,.3,1)`). Back slides back left. Implemented with `motion`'s `<AnimatePresence mode="popLayout">` + a custom `::view-transition-old`/`::view-transition-new` keyframe for the route boundary.
- **Inline reply composer:** clicking "Reply" on a comment expands the same composer pattern inline below that comment — title-less, body-only.
- **OP badge:** the post author's username gets an inline jade "OP" tag.
- **Edited flag:** small italic "edited" next to the time stamp.

## 5. Tech stack & libraries

### 5.1 Added

- `tailwindcss@4` + `@tailwindcss/postcss` + Tailwind v4 config (project has no Tailwind yet).
- `shadcn` (CLI-based; components copied into `components/ui/`).
- `tailwindcss-animate` (auto-included by shadcn for Radix primitives — accordion-down, fade-in, etc.).
- `motion` (the renamed framer-motion package; import from `motion/react`). Used sparingly — only where springs or layout animations matter (vote pop, +1 ghost, composer expand, new-post glow, comment slide).
- `sonner` (toast — replaces Chakra's Toaster; called via `toast()` from `sonner`).
- `lucide-react` (shadcn-generated components import from it).
- `cmdk` (peer dep of shadcn's `<Command>` — powers the Cmd-K search overlay).

### 5.2 Removed (Phase 8)

- `@chakra-ui/react`
- `@emotion/cache`, `@emotion/react`, `@emotion/styled`
- `framer-motion` (the unused 12.x; replaced by `motion` as a fresh re-add)
- `@fontsource/open-sans`

### 5.3 Kept

- `next` (16.x), `react` (19.x), `next-themes` (already wiring `class`-attribute dark mode).
- `react-hook-form` + `zod` (already used by the composer).
- `react-icons` — wholesale icon swap to lucide is busywork; new components use lucide, surviving react-icons usages stay until they're naturally touched.
- `@tanstack/react-query` (Phase C).
- `drizzle-orm`, `postgres`, `better-auth` (Phase A).
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (Phase B).

### 5.4 Fonts

Loaded via `next/font/google` in `app/layout.tsx`:
```ts
import { Inter, Source_Serif_4 } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
```
The variables are exposed to Tailwind via the `font-sans` / `font-serif` utilities.

### 5.5 View Transitions

`unstable_ViewTransition` from `next` is wrapped around the relevant layout. Pages/components opt in with the `viewTransitionName` inline style. Firefox fallback is the crossfade.

## 6. Phased migration plan (8 commits, one branch, one PR)

Branch: `feat/phase-d-pcf-redesign`. Each phase ends green:
```
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```
(All four with `;` so every failure shows, not just the first. PowerShell 5.1 has no `&&`.)

Chakra + shadcn **coexist** through phases 1–7; teardown is phase 8.

### Phase 1 — Foundation (parallel install)

- `pnpm dlx shadcn@latest init` — pick CSS-vars strategy.
- Write `app/globals.css` with Mountain Jade tokens overriding shadcn's defaults (light + dark).
- `tailwind.config.ts` — `darkMode: "class"`, font CSS-var integration.
- Add `next/font` (Inter + Source Serif 4) wired to `<html>` className.
- Install: `motion`, `sonner`, `lucide-react`, `cmdk`.
- Add `<Toaster />` (sonner) to `app/layout.tsx`.
- Rename `package.json` `name` field → `projectconfucius-forum`. Update `<title>` metadata and README.
- Smoke test: a temporary `<Button>` from shadcn renders in dev with Mountain Jade.

### Phase 2 — Primitives

- `pnpm dlx shadcn add button input textarea label separator skeleton dialog dropdown-menu tabs popover scroll-area sheet avatar badge tooltip command form select`.
- Verify each renders with Mountain Jade.
- No app components migrated yet.

### Phase 3 — Layout shell

- Rewrite `app/layout.tsx`, `components/layout/Layout.tsx`, `PageContent.tsx`.
- Rewrite `Navbar.tsx`, `SearchInput.tsx` → Cmd-K via `cmdk`, `Directory.tsx`, `RightContent.tsx`, `UserMenu.tsx`.
- New `Sidebar.tsx` (persistent on `/` and `/c/[id]`).
- Mobile: `<Sheet>`-based drawer summoned by hamburger.
- Add `app/c/[id]/` routes + 308 redirects from old `/community/[id]/*`.
- Drop the old `ColorModeProvider` wrapper; use `ThemeProvider` from `next-themes` directly (shadcn-idiomatic).

### Phase 4 — Feed & post cards

- Rewrite `Posts.tsx`, `PostItem.tsx`, `PostBody.tsx`, `PostTitle.tsx`, `PostDetails.tsx`, `PostActions.tsx`, `VoteSection.tsx` in shadcn + Tailwind.
- `motion/react` for vote-pop spring + `<AnimatePresence>` +1 ghost.
- Card hover lift via CSS (`hover:-translate-y-0.5 hover:shadow-...`).
- `viewTransitionName` set on the outer card, vote rail, and title.
- `PostLoader`, `PostLoaderItem` rewritten with shadcn `<Skeleton>` + jade-tinted shimmer keyframe.
- Home (`/`) and community feed (`/c/[id]`) fully migrated.

### Phase 5 — Post detail + comments

- Intercepting routes:
  - `app/c/[id]/@modal/(.)posts/[pid]/page.tsx` (overlay)
  - `app/c/[id]/posts/[pid]/page.tsx` (real page)
  - `app/c/[id]/posts/[pid]/comment/[cid]/page.tsx` (sub-thread)
- New components: `PostDetail.tsx`, `Comments.tsx`, recursive `CommentNode.tsx` with `depth` prop, `ContinueThreadButton.tsx`, `RepliesSummary.tsx`, `InlineReplyComposer.tsx`, `SortBar.tsx`.
- TanStack Query cursor-pagination for comments.
- View Transitions wired on shared elements.
- Sub-thread slide via motion + custom `::view-transition-*` keyframes.

### Phase 6 — Composer + create flow

- `components/posts/composer/InlineComposer.tsx` — expand-in-place at top of feed.
- `components/posts/composer/ModalComposer.tsx` — navbar "+" trigger; wraps the same form in a `<Dialog>` with a community-picker.
- `RestrictedComposerNotice.tsx`.
- Optimistic insert + 3-second jade-glow animation on the new post.
- Tabs (Text / Image / Link) via shadcn `<Tabs>`. Title field + body field via shadcn `<Input>` / `<Textarea>`.
- **Delete:** `app/community/[id]/submit/`, `NewPostForm.tsx`, `BackToCommunityButton.tsx`, `PostCreateError.tsx`, `TextInputs.tsx`, `CreatePostLink.tsx`.
- Keep `ImageUpload.tsx` (adapted — still used by `ImageCropModal`).

### Phase 7 — Modals → pages & remaining modals

- **Convert-and-keep** (modal stays a modal in shadcn `<Dialog>` / `<Command>`):
  - `ConfirmationDialog`
  - `ImageCropModal`
  - `CreateCommunityModal`
  - Search overlay (`<Command>` via `cmdk`)
- **Move-to-page:**
  - `ProfileModal` → `/settings/profile` page
  - `SavedPostsModal` → `/saved` page
  - `CommunitySettings*` (multi-section modal) → `/c/[id]/settings` page with `<Tabs>` for general/privacy/image/admins/danger
  - `CommunityMembersModal` → `/c/[id]/members` page
- Update every trigger point in the codebase to navigate to the new page instead of opening a modal.
- Prune stale modal-state atoms from `atoms/uiAtom.ts`.

### Phase 8 — Teardown

- Remove from `package.json` dependencies: `@chakra-ui/react`, `@emotion/cache`, `@emotion/react`, `@emotion/styled`, `framer-motion` (the unused 12.x), `@fontsource/open-sans`.
- Delete: `chakra/theme.ts`, `chakra/button.ts`, `chakra/` folder; `app/emotion-registry.tsx`; `components/ui/color-mode.tsx` (or reduce to a 5-line `useTheme` re-export from `next-themes` if any non-shadcn code still imports `useColorMode`); `components/ui/toaster.tsx` (replaced by sonner); `components/ui/password-input.tsx` if unused.
- Drop `ChakraProvider` + `EmotionRegistry` wrappers from `app/providers.tsx`.
- Final dead-code sweep.
- Verify: `grep -r "@chakra-ui\|@emotion" src/ app/ components/ lib/` returns zero matches.
- Final green-gate.

## 7. Component → component mapping (Chakra v3 → shadcn)

| Chakra v3 | shadcn equivalent | Notes |
|---|---|---|
| `<Box>`, `<Flex>`, `<Stack>` | plain `<div>` + Tailwind | no shadcn primitive — these are layout, not UI |
| `<Text>` | `<p>` / `<span>` + Tailwind | `font-serif` utility on titles |
| `<Button>` | shadcn `<Button>` | size/variant maps; `colorPalette="red"` → `variant="destructive"` |
| `<Input>`, `<Textarea>` | shadcn `<Input>`, `<Textarea>` | direct swap |
| `<Separator>` | shadcn `<Separator>` | direct swap |
| `<Skeleton>`, `<SkeletonText>` | shadcn `<Skeleton>` | extended with jade-tinted shimmer in `globals.css` |
| `<Image>` (Chakra) | `next/image` | optimized loader |
| `<Icon as={...}>` | direct `<svg>` or lucide component | drop the wrapper |
| `<DialogRoot>` + Dialog* parts | shadcn `<Dialog>` + parts | Radix-based; structure similar |
| `<MenuRoot>` + `<MenuPositioner>` + items | shadcn `<DropdownMenu>` + parts | |
| `<Tabs.Root>` + parts | shadcn `<Tabs>` + parts | almost 1:1 |
| `<Portal>` | not needed (shadcn portals internally) | drop |
| `useCustomToast` hook | wrap `toast()` from sonner | preserve hook signature so call-sites don't change |

Compound domain components (post card, vote rail, comment node, composer) are built from primitive `<div>` + Tailwind, not from shadcn primitives. The mapping above only covers generic UI atoms.

**Icons:** lucide-react for new components. Vote arrows and a few other Mountain-Jade-specific glyphs (clay downvote arrow, jade triangle-up) are hand-rolled small SVGs since neither library has the precise style we want.

## 8. Testing, risks, non-goals, done criteria

### 8.1 Testing strategy

- Vitest already in place (`vitest.config.ts`). Existing tests in `__tests__/` must keep passing through every phase — they cover data-layer hooks and helpers that Phase D doesn't touch.
- **Add** unit tests for new logical pieces only:
  - Composer state machine (closed → open → submitting → error/success).
  - `CommentNode` depth-tracking + collapse-state toggle.
  - `ContinueThreadButton` URL-building helper.
  - Optimistic-insert + jade-glow timing helper (uses `setTimeout`; test with fake timers).
- **Don't add** snapshot tests for visual output — ages badly, doesn't catch what we care about.
- Each phase's green-gate includes a manual smoke pass through the primary flows: feed scroll, post-detail morph, comment + reply, vote, sub-thread navigation, create-post inline, sign-out, mobile sheet.

Tests are invoked as `pnpm test <path>` (script alias), not `pnpm vitest run <path>`.

### 8.2 Risk register

- **View Transitions in Firefox:** no native support as of 2026-05. Feature-detect (`if ("startViewTransition" in document)`) and fall back to a 220 ms Tailwind `transition-opacity` crossfade. Documented to avoid bug reports.
- **Intercepting routes:** still has rough edges in Next 16 (parallel-route slots have had bugs around `not-found` / errors). If `@modal/(.)posts/[pid]` is flaky, fall back to a controlled shadcn `<Dialog>` rendering the same `<PostDetail>`; URL still updates via `router.push`; the morph still works.
- **Bundle size:** `motion` ~30 KB gzipped, `sonner` ~5 KB, `cmdk` ~6 KB. After Chakra (~80 KB) + Emotion + old framer-motion removal, **net is negative**.
- **Server/client boundaries:** post-detail and comments are read-mostly — server components. Composer and vote interactions are client. Keep the client boundary at the smallest leaves possible.

### 8.3 Non-goals

- No data-layer changes — Phase A–C territory; complete on `main`.
- No new features. Same posts, communities, votes, comments — different chrome and interactions.
- No i18n.
- No analytics / telemetry wiring.
- No SEO overhaul beyond what falls out naturally from route renames + updated `<title>` metadata.
- No formal WCAG audit as a separate task — shadcn primitives ship with Radix's accessibility baked in; a standalone audit is its own future track.
- No mobile-app work beyond responsive web.

### 8.4 Phase D "done" criteria

1. Branch `feat/phase-d-pcf-redesign` merged to `main` as one atomic PR (8 phase commits).
2. `pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build` all pass.
3. `grep -r "@chakra-ui\|@emotion" app/ components/ lib/ hooks/ schema/ atoms/ types/ chakra/` returns zero matches.
4. `package.json` no longer lists `@chakra-ui/react`, `@emotion/cache`, `@emotion/react`, `@emotion/styled`, `framer-motion` (12.x), or `@fontsource/open-sans`.
5. All routes in §3's table resolve; 308 redirects in place for old `/community/[id]/*` paths.
6. Manual smoke pass: feed loads, post-detail morph works, comment-thread sub-route works, inline composer creates + jade-glows the new post, mobile sheet works, sign-out works.
7. The forum looks like the Mountain Jade design language end-to-end — no leftover Chakra default styling visible.

## 9. Out of scope (future phases)

- Real-time vote/comment updates via Postgres LISTEN/NOTIFY or websockets.
- Federation / activitypub.
- Native mobile apps.
- Notifications / inbox.
- Moderator tools beyond what `/c/[id]/settings/admins` already covers.
- Markdown-rendering polish (current implementation is intentionally minimal).
