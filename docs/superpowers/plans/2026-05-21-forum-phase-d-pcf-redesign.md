# Phase D — PCF Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the forum from Chakra UI v3 + Emotion to shadcn + Tailwind v4 + Mountain Jade design language, fix the deceptive create-post flow with an inline-expand composer, add intercepting-route + shared-element morph for post detail, ship Reddit-style threaded comments, and rename the app to `projectconfucius forum` ("PCF") — all in one branch (`feat/phase-d-pcf-redesign`), eight phased commits, one atomic merge PR.

**Architecture:** Eight phases on a single long-lived branch. Phases 1–7 keep Chakra + shadcn coexisting (provider tree hosts both) so every intermediate commit is buildable and visually-functional. Phase 8 tears Chakra/Emotion out atomically. New routes (`/c/[id]/...`) live alongside legacy `/community/[id]/...` redirects. Post detail uses Next.js intercepting routes + the View Transitions API. Composer is an inline-expand component; create-post page (`/submit`) is deleted.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 6 · Tailwind v4 + shadcn + `tailwindcss-animate` · `motion` (renamed framer-motion) · `sonner` toasts · `lucide-react` + (kept) `react-icons` · `cmdk` · `next-themes` (kept, rewired) · `next/font` (Inter + Source Serif 4) · Vitest + happy-dom (kept). Removed at the end: `@chakra-ui/react`, `@emotion/*`, `framer-motion` (the unused 12.x), `@fontsource/open-sans`.

**Spec:** [`docs/superpowers/specs/2026-05-21-forum-phase-d-pcf-redesign-design.md`](../specs/2026-05-21-forum-phase-d-pcf-redesign-design.md)

**Green gate (every phase):**
```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```
PowerShell 5.1 — use `;` (unconditional chain). All four must pass. Invoke vitest as `pnpm test <path>` (not `pnpm vitest run`).

**Commit style:** every phase ends with one commit using the message format `feat(forum,phase-d): Phase N — <name>`. Co-author footer included by `git commit` skill template, not hand-written here.

---

## Task 0: Cut the branch

**Files:** none (git only).

- [x] **Step 1: Verify on `main` and clean**

```powershell
git status
git log --oneline -1
```
Expected: on `main`, working tree clean, last commit `fbef5d2 docs(forum): add migration roadmap…`.

- [x] **Step 2: Cut the feature branch**

```powershell
git checkout -b feat/phase-d-pcf-redesign
```

- [x] **Step 3: Confirm**

```powershell
git branch --show-current
```
Expected: `feat/phase-d-pcf-redesign`.

---

# Phase 1 — Foundation

Install Tailwind v4 + shadcn + the new deps, drop Mountain Jade tokens into `globals.css`, wire `next/font` for Inter + Source Serif 4, mount the Sonner Toaster, rename the app. Chakra + Emotion **stay** running. Verify with one temporary shadcn `<Button>` that the new stack works alongside the old.

## Task 1.1: Install Tailwind v4 + PostCSS

**Files:**
- Create: `postcss.config.mjs`
- Modify: `package.json`

- [x] **Step 1: Install Tailwind v4 + PostCSS**

```powershell
pnpm add -D tailwindcss@^4 @tailwindcss/postcss@^4
```

- [x] **Step 2: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [x] **Step 3: Verify install**

```powershell
pnpm list tailwindcss @tailwindcss/postcss
```
Expected: both at v4.x.

## Task 1.2: Initialize shadcn (CSS-vars strategy)

**Files:**
- Create: `components.json`
- Modify: `tsconfig.json` if shadcn needs path alias updates (it shouldn't — `@/*` already configured).

- [x] **Step 1: Run shadcn init**

```powershell
pnpm dlx shadcn@latest init
```
Answer the prompts:
- Style: **New York**
- Base color: **Slate** (we override with Mountain Jade in Task 1.3)
- CSS variables: **Yes**
- Tailwind config: confirm the path it suggests
- Components path: `components/ui`
- Utils path: `lib/utils`
- RSC: **Yes**

- [x] **Step 2: Confirm the generated `components.json`**

```powershell
cat components.json
```
Expected: aliases point to `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`.

- [x] **Step 3: Verify `lib/utils.ts` was created**

If not, create it:
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
Install if needed:
```powershell
pnpm add clsx tailwind-merge class-variance-authority
```

## Task 1.3: Write Mountain Jade tokens into `app/globals.css`

**Files:**
- Modify or create: `app/globals.css`

- [x] **Step 1: Replace or write `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-serif-source), Georgia, "Source Serif 4", serif;
}

:root {
  --background: 200 9% 94%;             /* #EEF1F2 */
  --foreground: 180 12% 8%;             /* #101A1A */
  --surface: 0 0% 100%;
  --card: 0 0% 100%;
  --card-foreground: 180 12% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 180 12% 8%;
  --primary: 173 53% 36%;               /* Mountain Jade #2A8C82 */
  --primary-foreground: 0 0% 100%;
  --primary-deep: 173 58% 26%;          /* #1C685E */
  --primary-soft: 173 50% 80%;          /* jade-200 #9CD9D1 */
  --primary-mute: 173 47% 92%;          /* jade-50 #E4F1EF */
  --secondary: 195 6% 91%;
  --secondary-foreground: 180 12% 8%;
  --muted: 195 6% 91%;
  --muted-foreground: 180 8% 35%;
  --accent: 173 47% 92%;
  --accent-foreground: 173 58% 26%;
  --destructive: 0 30% 49%;             /* clay-rose #A45656 */
  --destructive-foreground: 0 0% 100%;
  --border: 180 8% 90%;                 /* #E3E8E8 */
  --input: 180 8% 90%;
  --ring: 173 53% 36%;
  --radius: 0.625rem;
}

.dark {
  --background: 174 33% 9%;             /* #0F1E1C */
  --foreground: 168 11% 91%;            /* #E7EEED */
  --surface: 174 30% 12%;               /* #152826 */
  --card: 174 30% 12%;
  --card-foreground: 168 11% 91%;
  --popover: 174 30% 12%;
  --popover-foreground: 168 11% 91%;
  --primary: 173 47% 46%;               /* #3FA89C */
  --primary-foreground: 174 50% 9%;
  --primary-deep: 173 53% 36%;
  --primary-soft: 173 50% 30%;
  --primary-mute: 174 30% 16%;
  --secondary: 174 22% 17%;
  --secondary-foreground: 168 11% 91%;
  --muted: 174 22% 17%;
  --muted-foreground: 168 8% 60%;
  --accent: 174 30% 18%;
  --accent-foreground: 168 11% 91%;
  --destructive: 0 47% 67%;             /* #D08585 */
  --destructive-foreground: 174 50% 9%;
  --border: 174 23% 17%;
  --input: 174 23% 17%;
  --ring: 173 47% 46%;
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
}

/* Jade-tinted skeleton shimmer (replaces shadcn default gray) */
@keyframes shimmer-jade {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skel-jade {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--primary-mute)) 50%,
    hsl(var(--muted)) 100%);
  background-size: 200% 100%;
  animation: shimmer-jade 1600ms ease-in-out infinite;
}

/* New-post jade glow (used after composer submit) */
@keyframes new-post-glow {
  0%   { box-shadow: 0 0 0 3px hsl(var(--primary-mute)); border-color: hsl(var(--primary)); }
  100% { box-shadow: 0 0 0 0 hsl(var(--primary-mute) / 0); border-color: hsl(var(--border)); }
}
.new-post-glow { animation: new-post-glow 3000ms ease-out forwards; }
```

- [x] **Step 2: Import `globals.css` in `app/layout.tsx`**

Add the import line at the top of `app/layout.tsx`:
```ts
import "./globals.css";
```
(Keep the rest of the file unchanged for now — providers stay.)

## Task 1.4: Wire `next/font` for Inter + Source Serif 4

**Files:**
- Modify: `app/layout.tsx`

- [x] **Step 1: Add font imports and apply to `<html>`**

```tsx
import "./globals.css";
import { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: "projectconfucius forum",
  description: "礼楽 — a place for considered discussion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${serif.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Task 1.5: Install motion, sonner, lucide-react, cmdk

- [x] **Step 1: Install**

```powershell
pnpm add motion sonner lucide-react cmdk
```

- [x] **Step 2: Verify**

```powershell
pnpm list motion sonner lucide-react cmdk
```
Expected: all four installed.

## Task 1.6: Add Sonner Toaster to providers

**Files:**
- Modify: `app/providers.tsx`

- [x] **Step 1: Add Sonner Toaster alongside the existing Chakra Toaster (both run)**

Edit `app/providers.tsx` to import and mount `<Toaster />` from sonner above the existing one:

```tsx
"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster as ChakraToaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/queries/provider";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { Toaster as SonnerToaster } from "sonner";
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
            {mounted && <ChakraToaster />}
            <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
          </ChakraProvider>
        </EmotionRegistry>
      </QueryProvider>
    </JotaiProvider>
  );
}
```

(The renamed `ChakraToaster` is the existing Chakra-derived toaster; the new `SonnerToaster` is the eventual replacement. Both coexist through phase 7.)

## Task 1.7: Rename the package + metadata

**Files:**
- Modify: `package.json`, `README.md`

- [x] **Step 1: Edit `package.json` `name` field**

Change:
```json
"name": "next_discussion_platform",
```
to:
```json
"name": "projectconfucius-forum",
```

- [x] **Step 2: Update `README.md` title**

Replace the first heading with `# projectconfucius forum (PCF)`.

(Metadata title in `app/layout.tsx` already updated in Task 1.4.)

## Task 1.8: Smoke test — temporary shadcn Button on `/`

**Files:**
- Add: shadcn `<Button>` primitive (via CLI).
- Modify: `app/page.tsx` (add a temporary button at the top).

- [x] **Step 1: Add the shadcn Button primitive only (other primitives are Phase 2)**

```powershell
pnpm dlx shadcn@latest add button
```
Confirms creation of `components/ui/button.tsx`.

- [x] **Step 2: Mount a temporary smoke-test button at the top of `app/page.tsx`**

Add (above the existing JSX root):
```tsx
import { Button } from "@/components/ui/button";
// inside the returned JSX, top of root:
<div className="font-sans p-4">
  <Button>PCF smoke test (Mountain Jade) — remove in phase 3</Button>
</div>
```

- [x] **Step 3: Run dev and visually verify**

```powershell
pnpm dev
```
Open `http://localhost:3000`. Expected: button visible at top with jade `#2A8C82` background. Existing Chakra components below render unchanged.

- [x] **Step 4: Stop dev (Ctrl-C). Leave the smoke button in place — it's removed in Phase 3 when `app/page.tsx` is rewritten.**

## Task 1.9: Phase 1 green-gate + commit

- [x] **Step 1: Run green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```
Expected: all four pass.

- [x] **Step 2: Stage and commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 1 — foundation (tailwind, shadcn, motion, sonner, fonts, rename)"
```

---

# Phase 2 — Primitives

Add the shadcn primitives we'll need. No app code touched. Each primitive renders correctly with Mountain Jade tokens because globals.css is wired.

## Task 2.1: Add all shadcn primitives in one batch

- [ ] **Step 1: Run the bulk add**

```powershell
pnpm dlx shadcn@latest add input textarea label separator skeleton dialog dropdown-menu tabs popover scroll-area sheet avatar badge tooltip command form select
```
Expected: each command creates the corresponding file under `components/ui/`. Allow overwrites if prompted (none should exist except `button.tsx` from Task 1.8 — leave it).

- [ ] **Step 2: Quick visual smoke**

In `app/page.tsx`, briefly add (under the smoke Button):
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
// add to the temp smoke block:
<Skeleton className="h-4 w-32 mt-2" />
<Badge className="ml-2">badge</Badge>
```
Run `pnpm dev`. Confirm skeleton + badge render. Then remove those two lines (leave the Button until Phase 3).

## Task 2.2: Phase 2 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 2 — shadcn primitives (button/input/dialog/dropdown/tabs/etc)"
```

---

# Phase 3 — Layout shell

Rewrite the outer layout (`Layout`, `Navbar`, `Sidebar`, `PageContent`), introduce Cmd-K search via `cmdk`, restructure routes from `/community/[id]` → `/c/[id]` with 308 redirects, and replace the old `ColorModeProvider` wrapper with `next-themes`' `ThemeProvider` directly. Chakra still runs for inner components.

## Task 3.1: Re-wire theme provider — drop `ColorModeProvider` wrapper

**Files:**
- Modify: `app/providers.tsx`
- Keep (do not delete yet): `components/ui/color-mode.tsx` — still exports `useColorMode` / `useColorModeValue` used by inner Chakra components. We'll simplify it in Phase 8.

- [ ] **Step 1: Replace `<ColorModeProvider>` with `<ThemeProvider>` from next-themes directly**

```tsx
"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { Toaster as ChakraToaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/queries/provider";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <JotaiProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <EmotionRegistry>
            <ChakraProvider value={theme}>
              <Layout>{children}</Layout>
              {mounted && <ChakraToaster />}
            </ChakraProvider>
          </EmotionRegistry>
          <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
        </ThemeProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}
```

`useColorMode` / `useColorModeValue` in `components/ui/color-mode.tsx` already proxy `next-themes` — they keep working without change.

## Task 3.2: Rewrite `Layout` shell (two-column with persistent sidebar)

**Files:**
- Modify: `components/layout/Layout.tsx`
- Modify: `components/layout/PageContent.tsx` (becomes thinner — sidebar handled at Layout)
- Create: `components/layout/AppShell.tsx` (new outer shell — Navbar + sidebar + main grid)

- [ ] **Step 1: Read the current `Layout.tsx` to understand what state it provides**

```powershell
cat components/layout/Layout.tsx
```

- [ ] **Step 2: Create `components/layout/AppShell.tsx`**

```tsx
"use client";

import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  withSidebar = true,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <main
        className={cn(
          "mx-auto max-w-[1080px] px-3 pb-12 pt-4",
          withSidebar
            ? "grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]"
            : "grid grid-cols-1"
        )}
      >
        <div className="min-w-0">{children}</div>
        {withSidebar && (
          <aside className="hidden md:block">
            <Sidebar />
          </aside>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace `Layout.tsx` to delegate to `AppShell`**

```tsx
"use client";
import AppShell from "./AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Simplify `PageContent.tsx` to be a passthrough column (sidebar now owned by AppShell)**

```tsx
import { ReactElement } from "react";
type Props = { children: ReactElement | [ReactElement, ReactElement?]; };
export default function PageContent({ children }: Props) {
  const arr = Array.isArray(children) ? children : [children];
  return <div className="space-y-3">{arr[0]}</div>;
}
```
(The legacy `PageContent` used to render two columns; we now just render the primary column — the sidebar moved up to AppShell. Some callers pass a second child for "sidebar content"; we ignore it here since AppShell owns it.)

## Task 3.3: Build `Sidebar` (persistent on `/` and `/c/[id]`)

**Files:**
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/SidebarHome.tsx` (home context)
- Create: `components/layout/SidebarCommunity.tsx` (community context)

- [ ] **Step 1: Create `Sidebar.tsx` — context router**

```tsx
"use client";
import { usePathname } from "next/navigation";
import SidebarHome from "./SidebarHome";
import SidebarCommunity from "./SidebarCommunity";

export default function Sidebar() {
  const path = usePathname() ?? "/";
  const match = path.match(/^\/c\/([^/]+)/);
  if (match) return <SidebarCommunity communityId={match[1]} />;
  return <SidebarHome />;
}
```

- [ ] **Step 2: Create `SidebarHome.tsx`** — Your communities + Discover + community-quote card

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SidebarHome() {
  const { data: session } = useSession();
  const { data: snippets } = useCommunitySnippetsQuery({
    enabled: !!session?.user,
  });

  return (
    <div className="space-y-3">
      {session?.user && (
        <Card title="Your communities">
          {(snippets ?? []).map((s) => (
            <Link
              key={s.communityId}
              href={`/c/${s.communityId}`}
              className="flex items-center gap-2.5 py-1.5 border-b border-border/60 last:border-0 hover:pl-1 transition-[padding] duration-200"
            >
              <div
                className="size-7 rounded-full shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                style={{
                  background: s.imageUrl
                    ? `url(${s.imageUrl}) center/cover`
                    : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
                }}
              />
              <span className="text-sm font-semibold truncate">c/{s.communityId}</span>
            </Link>
          ))}
        </Card>
      )}
      <CommunityQuoteCard />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5">
      <div className="text-[10.5px] tracking-[0.1em] uppercase font-bold text-muted-foreground mb-2.5">{title}</div>
      {children}
    </div>
  );
}

function CommunityQuoteCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-mute to-card p-4 text-center">
      <p className="font-serif italic text-primary text-sm leading-snug">
        "The unexamined life<br />is not worth living."
      </p>
      <p className="text-[10px] text-muted-foreground mt-1.5">— rotating community quote</p>
    </div>
  );
}
```

If `useCommunitySnippetsQuery` doesn't exist under that name, grep `lib/queries/community/` to find the actual hook and use it. (The Phase C work added these hooks; pick the one that returns "communities the current user is a member of".)

- [ ] **Step 3: Create `SidebarCommunity.tsx`** — About card + moderators + similar

```tsx
"use client";

import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

export default function SidebarCommunity({ communityId }: { communityId: string }) {
  const { data: community } = useCommunityDataQuery({ communityId });
  if (!community) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5">
      <div className="font-serif text-base font-semibold">c/{community.id}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {community.privacyType === "private"
          ? "Private community — members only."
          : "A community for considered discussion."}
      </p>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
        <span className="text-muted-foreground">
          <strong className="text-foreground">{community.numberOfMembers ?? 0}</strong> members
        </span>
        <span className="text-muted-foreground">
          {community.createdAt
            ? `since ${new Date(community.createdAt).getFullYear()}`
            : ""}
        </span>
      </div>
    </div>
  );
}
```

## Task 3.4: Rewrite `Navbar` in shadcn

**Files:**
- Modify: `components/navbar/Navbar.tsx`
- Modify: `components/navbar/right-content/RightContent.tsx`
- Modify: `components/navbar/right-content/AuthButtons.tsx`
- Modify: `components/navbar/right-content/user-menu/UserMenu.tsx`
- Modify: `components/navbar/right-content/user-menu/UserMenuButton.tsx`
- Modify: `components/navbar/right-content/user-menu/UserMenuList.tsx`

- [ ] **Step 1: Rewrite `Navbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import SearchTrigger from "./SearchTrigger";
import RightContent from "./right-content/RightContent";
import Directory from "./directory/Directory";
import { ComposerLauncher } from "@/components/posts/composer/ComposerLauncher";
// ComposerLauncher is built in Phase 6; for now stub it as a no-op button.

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-1 z-50 mx-1.5 mt-1.5 rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex h-[62px] items-center gap-3 px-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="size-7 rounded-lg relative shadow-[0_2px_6px_-2px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-deep)))" }}
          >
            <div className="absolute inset-[6px] border-[1.5px] border-white/85 rounded" />
          </div>
          <span className="hidden md:inline font-extrabold tracking-tight text-base">PCF</span>
        </Link>

        {user && <Directory />}
        <SearchTrigger />
        <ComposerLauncher />
        <RightContent user={user} loading={isPending} />
      </div>
    </header>
  );
}
```

If `ComposerLauncher` isn't built yet (it's Phase 6), stub it:
```tsx
// components/posts/composer/ComposerLauncher.tsx (stub for Phase 3; real impl in Phase 6)
export function ComposerLauncher() { return null; }
```

- [ ] **Step 2: Rewrite `RightContent.tsx`** to use shadcn primitives

```tsx
"use client";
import { SessionUser } from "@/types/sessionUser";
import AuthButtons from "./AuthButtons";
import UserMenu from "./user-menu/UserMenu";

export default function RightContent({
  user,
  loading,
}: { user: SessionUser | null; loading?: boolean; }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      {loading ? null : user ? <UserMenu user={user} /> : <AuthButtons />}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `AuthButtons.tsx`** → shadcn `<Button>`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthButtons() {
  return (
    <>
      <Button asChild variant="outline" size="sm">
        <Link href="/api/auth/start">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/api/auth/start">Sign up</Link>
      </Button>
    </>
  );
}
```

- [ ] **Step 4: Rewrite `UserMenu.tsx`** → shadcn `<DropdownMenu>` + page navigation for profile/saved (no more modals)

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { SessionUser } from "@/types/sessionUser";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";

export default function UserMenu({ user }: { user: SessionUser }) {
  const initials = (user.name ?? user.email ?? "?")
    .split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="size-6">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline max-w-[120px] truncate">{user.name ?? user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="font-semibold truncate">{user.name ?? "u/anon"}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/settings/profile">Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/saved">Saved posts</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

The `/settings/profile` and `/saved` routes don't exist yet — they're Phase 7. The links will 404 until then; that's fine for the gate (no broken builds, just a missing route).

- [ ] **Step 5: Delete the now-unused `UserMenuButton.tsx` and `UserMenuList.tsx`**

```powershell
Remove-Item components/navbar/right-content/user-menu/UserMenuButton.tsx, components/navbar/right-content/user-menu/UserMenuList.tsx, components/navbar/right-content/Icons.tsx, components/navbar/right-content/LogOutButton.tsx -Force
```

- [ ] **Step 6: Rewrite `CustomMenuButton.tsx` if it's still referenced — check**

```powershell
pnpm exec rg "CustomMenuButton" --type ts --type tsx
```
If no matches: `Remove-Item components/ui/CustomMenuButton.tsx -Force`. Otherwise migrate the references first.

## Task 3.5: Rewrite `Directory` (community picker) using shadcn

**Files:**
- Modify: `components/navbar/directory/Directory.tsx`
- Modify: `components/navbar/directory/Communities.tsx`
- Modify: `components/navbar/directory/MenuListItem.tsx`

- [ ] **Step 1: Rewrite `Directory.tsx`** as a shadcn DropdownMenu

```tsx
"use client";

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useActiveCommunity } from "@/hooks/community/useActiveCommunity";
import Communities from "./Communities";
import { ChevronDown, Home } from "lucide-react";
import Link from "next/link";

export default function Directory() {
  const { community } = useActiveCommunity();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 hidden md:flex">
          {community ? (
            <>
              <div
                className="size-5 rounded-full"
                style={{
                  background: community.imageUrl
                    ? `url(${community.imageUrl}) center/cover`
                    : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
                }}
              />
              <span>c/{community.id}</span>
            </>
          ) : (
            <>
              <Home className="size-4" />
              <span>Home</span>
            </>
          )}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem asChild>
          <Link href="/" className="gap-2"><Home className="size-4" /> Home</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Your communities
        </DropdownMenuLabel>
        <Communities />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Rewrite `Communities.tsx`** to render shadcn `DropdownMenuItem`s

```tsx
"use client";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function Communities() {
  const { data: session } = useSession();
  const { data: snippets } = useCommunitySnippetsQuery({ enabled: !!session?.user });
  if (!snippets?.length) {
    return <DropdownMenuItem disabled>No communities yet</DropdownMenuItem>;
  }
  return (
    <>
      {snippets.map((s) => (
        <DropdownMenuItem key={s.communityId} asChild>
          <Link href={`/c/${s.communityId}`} className="gap-2.5">
            <div
              className="size-5 rounded-full shrink-0"
              style={{
                background: s.imageUrl
                  ? `url(${s.imageUrl}) center/cover`
                  : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
              }}
            />
            <span className="truncate">c/{s.communityId}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}
```

- [ ] **Step 3: Delete `MenuListItem.tsx` (now unused)**

```powershell
Remove-Item components/navbar/directory/MenuListItem.tsx -Force
```

## Task 3.6: Build Cmd-K `SearchTrigger` + `SearchPalette`

**Files:**
- Create: `components/navbar/SearchTrigger.tsx`
- Create: `components/navbar/SearchPalette.tsx`
- Delete: `components/navbar/SearchInput.tsx`, `components/navbar/SearchModal.tsx`

- [ ] **Step 1: Write `SearchTrigger.tsx`**

```tsx
"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SearchPalette from "./SearchPalette";

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 max-w-[360px] hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full
          bg-muted border border-border text-muted-foreground text-xs
          hover:border-primary-soft hover:bg-card transition-colors"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search communities, posts, people…</span>
        <kbd className="bg-card border border-border rounded px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

- [ ] **Step 2: Write `SearchPalette.tsx`** — shadcn CommandDialog

```tsx
"use client";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCommunitySearchQuery } from "@/lib/queries/community/use-community-search";

export default function SearchPalette({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data: results } = useCommunitySearchQuery({ q, enabled: q.length >= 2 });

  useEffect(() => { if (!open) setQ(""); }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search communities…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {(results?.length ?? 0) > 0 && (
          <CommandGroup heading="Communities">
            {results!.map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => { router.push(`/c/${c.id}`); onOpenChange(false); }}
              >
                c/{c.id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
```

If `useCommunitySearchQuery` doesn't yet exist, create a thin wrapper around whatever the Phase C search query is. Otherwise grep `lib/queries/community/` for the actual hook name and use it.

- [ ] **Step 3: Delete the old search components**

```powershell
Remove-Item components/navbar/SearchInput.tsx, components/navbar/SearchModal.tsx -Force
```

## Task 3.7: Mobile sidebar drawer via shadcn `<Sheet>`

**Files:**
- Modify: `components/navbar/Navbar.tsx` (add hamburger trigger for mobile)
- Create: `components/layout/MobileSidebarSheet.tsx`

- [ ] **Step 1: Write `MobileSidebarSheet.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import Sidebar from "./Sidebar";

export default function MobileSidebarSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-4"><Sidebar /></div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Mount it in `Navbar.tsx`** — first slot before the logo

Edit `Navbar.tsx`, add `<MobileSidebarSheet />` as the first child of the header `<div>`.

## Task 3.8: New routes — `/c/[id]` + 308 redirect from `/community/[id]`

**Files:**
- Create: `app/c/[communityId]/page.tsx` (initially just imports the existing community page client)
- Create: `app/c/[communityId]/layout.tsx` (will hold the `@modal` parallel slot in Phase 5)
- Modify: `next.config.js` → migrate to `next.config.ts` with redirects

- [ ] **Step 1: Migrate `next.config.js` to `next.config.ts` with redirects**

Delete the old:
```powershell
Remove-Item next.config.js -Force
```

Create `next.config.ts`:
```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/community/:communityId",
        destination: "/c/:communityId",
        permanent: true, // 308
      },
      {
        source: "/community/:communityId/comments/:pid",
        destination: "/c/:communityId/posts/:pid",
        permanent: true,
      },
      {
        source: "/community/:communityId/submit",
        destination: "/c/:communityId", // composer is inline; no submit page
        permanent: true,
      },
    ];
  },
};

export default config;
```

- [ ] **Step 2: Create `app/c/[communityId]/layout.tsx`**

```tsx
import { ReactNode } from "react";

// Parallel-route slot @modal will be added in Phase 5 alongside `children`.
export default function CommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Create `app/c/[communityId]/page.tsx`** — temporarily reuse the existing community client

```tsx
import CommunityClientPage from "@/app/community/[communityId]/comments/CommunityClientPage";

type Props = { params: Promise<{ communityId: string }> };

export default async function CommunityRoute({ params }: Props) {
  const { communityId } = await params;
  return <CommunityClientPage communityId={communityId} />;
}
```

Phase 4 will rewrite the community page properly. For now this just gets the route to render.

## Task 3.9: Remove the Phase 1 smoke button + verify shell

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Remove the temporary `<Button>` smoke test added in Task 1.8**

(The home page will be rewritten in Phase 4 — for now just delete the smoke block.)

- [ ] **Step 2: Run dev and verify**

```powershell
pnpm dev
```
Visit `/`, `/c/<existing-community>`, `/community/<existing-community>` (should 308-redirect). Confirm: new navbar with PCF logo + jade button, sidebar visible on home, mobile sheet works at <768px width. Existing Chakra-rendered post cards inside still render unchanged.

## Task 3.10: Phase 3 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 3 — layout shell (navbar, sidebar, Cmd-K, mobile sheet, /c/ routes)"
```

---

# Phase 4 — Feed & post cards

Rewrite every component on the feed surface in shadcn + Tailwind: `Posts`, `PostItem`, `PostBody`, `PostTitle`, `PostDetails`, `PostActions`, `VoteSection`, post loaders. Add `motion` vote-pop, +1 ghost, and `viewTransitionName` on the post card for the Phase 5 morph. Home and community feed both run on the new components.

## Task 4.1: Vote-pop animation primitive — `<MotionArrow>`

**Files:**
- Create: `components/posts/post-item/MotionArrow.tsx`

- [ ] **Step 1: Write the motion-wrapped arrow component**

```tsx
"use client";
import { motion } from "motion/react";

type Props = {
  filled: boolean;
  direction: "up" | "down";
  color?: string;
  onClick?: (e: React.MouseEvent<SVGElement>) => void;
  disabled?: boolean;
};

export default function MotionArrow({ filled, direction, color, onClick, disabled }: Props) {
  const path = direction === "up"
    ? "M12 3l9 12h-5v6h-8v-6H3z"
    : "M12 21l9-12h-5V3h-8v6H3z";
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      onClick={disabled ? undefined : onClick}
      style={{ color, cursor: disabled ? "not-allowed" : "pointer" }}
      animate={filled ? { scale: [1, 1.32, 1] } : { scale: 1 }}
      transition={{ duration: 0.36, ease: [0.2, 0.7, 0.3, 1.4] }}
      whileHover={disabled ? undefined : { scale: 1.15 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
    >
      <path
        d={path}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? 0 : 2}
      />
    </motion.svg>
  );
}
```

## Task 4.2: Vote-burst +1 ghost — `<VoteBurst>`

**Files:**
- Create: `components/posts/post-item/VoteBurst.tsx`

- [ ] **Step 1: Write the +1 ghost**

```tsx
"use client";
import { AnimatePresence, motion } from "motion/react";

export default function VoteBurst({ show, value }: { show: boolean; value: 1 | -1 }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          key={Date.now()}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -22 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
          className={
            "pointer-events-none absolute left-4 top-3 text-[11px] font-bold " +
            (value > 0 ? "text-primary" : "text-destructive")
          }
        >
          {value > 0 ? "+1" : "−1"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
```

## Task 4.3: Rewrite `VoteSection`

**Files:**
- Modify: `components/posts/post-item/VoteSection.tsx`

- [ ] **Step 1: Replace the file**

```tsx
"use client";
import { useState } from "react";
import MotionArrow from "./MotionArrow";
import VoteBurst from "./VoteBurst";
import { Post } from "@/types/post";

type Props = {
  userVoteValue?: number;
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string,
  ) => void;
  post: Post;
  votingDisabled?: boolean;
  isVotePending?: boolean;
};

export default function VoteSection({
  userVoteValue, onVote, post, votingDisabled, isVotePending,
}: Props) {
  const blocked = votingDisabled || isVotePending;
  const [burst, setBurst] = useState<{ at: number; value: 1 | -1 } | null>(null);

  const handle = (e: React.MouseEvent<SVGElement>, value: 1 | -1) => {
    if (blocked) return;
    onVote(e, post, value, post.communityId);
    if (userVoteValue !== value) setBurst({ at: Date.now(), value });
  };

  return (
    <div className="relative flex flex-col items-center gap-1 w-8 py-1.5 rounded-md bg-muted group-hover:bg-primary-mute transition-colors">
      <VoteBurst show={!!burst} value={burst?.value ?? 1} />
      <MotionArrow
        filled={userVoteValue === 1}
        direction="up"
        color={userVoteValue === 1 ? "hsl(var(--primary))" : undefined}
        onClick={(e) => handle(e, 1)}
        disabled={blocked}
      />
      <span
        className={
          "font-bold text-xs tabular-nums transition-colors " +
          (userVoteValue === 1 ? "text-primary"
            : userVoteValue === -1 ? "text-destructive"
            : "text-foreground")
        }
      >
        {post.voteStatus}
      </span>
      <MotionArrow
        filled={userVoteValue === -1}
        direction="down"
        color={userVoteValue === -1 ? "hsl(var(--destructive))" : undefined}
        onClick={(e) => handle(e, -1)}
        disabled={blocked}
      />
    </div>
  );
}
```

## Task 4.4: Rewrite `PostTitle`, `PostBody`, `PostDetails`, `PostActions`

**Files:**
- Modify: `components/posts/post-item/PostTitle.tsx`
- Modify: `components/posts/post-item/PostBody.tsx`
- Modify: `components/posts/post-item/PostDetails.tsx`
- Modify: `components/posts/post-item/PostActions.tsx`

- [ ] **Step 1: `PostTitle.tsx`**

```tsx
import { Post } from "@/types/post";

export default function PostTitle({ post }: { post: Post }) {
  return (
    <h3 className="font-serif font-semibold text-[17px] leading-snug tracking-[-0.005em] hover:text-primary transition-colors">
      {post.title}
    </h3>
  );
}
```

- [ ] **Step 2: `PostBody.tsx`** (preserves the image-loading state pattern from the existing file)

```tsx
"use client";
import Image from "next/image";
import { Post } from "@/types/post";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  post: Post;
  loadingImage: boolean;
  setLoadingImage: (v: boolean) => void;
};

export default function PostBody({ post, loadingImage, setLoadingImage }: Props) {
  return (
    <>
      {post.body && (
        <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-1 line-clamp-3">
          {post.body}
        </p>
      )}
      {post.imageUrl && (
        <div className="mt-2 relative">
          {loadingImage && <Skeleton className="h-48 w-full skel-jade rounded-lg" />}
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={720}
            height={480}
            className="rounded-lg w-full h-auto"
            onLoad={() => setLoadingImage(false)}
            style={{ display: loadingImage ? "none" : "block" }}
          />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: `PostDetails.tsx`**

```tsx
import { Post } from "@/types/post";
import Link from "next/link";
import moment from "moment";

type Props = { post: Post; showCommunityImage?: boolean };

export default function PostDetails({ post, showCommunityImage }: Props) {
  return (
    <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 mb-1">
      {showCommunityImage && (
        <Link href={`/c/${post.communityId}`} className="inline-flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-full inline-block"
            style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))" }}
          />
          <span className="text-primary font-semibold">c/{post.communityId}</span>
        </Link>
      )}
      <span>· {moment(post.createdAt).fromNow()} ·</span>
      <span className="font-serif italic">u/{post.creatorDisplayName}</span>
    </div>
  );
}
```

- [ ] **Step 4: `PostActions.tsx`**

```tsx
"use client";
import { MessageSquare, Share2, Bookmark, Trash2 } from "lucide-react";

type Props = {
  handleDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loadingDelete: boolean;
  userIsCreator: boolean;
  userIsAdmin?: boolean;
  postLink: string;
  handleSave: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSaved: boolean;
  showToast: (args: { title: string; description?: string; status?: "success" | "error" }) => void;
};

export default function PostActions({
  handleDelete, loadingDelete, userIsCreator, userIsAdmin,
  postLink, handleSave, isSaved, showToast,
}: Props) {
  return (
    <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-semibold">
      <button className="px-2 py-1 rounded hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
        <MessageSquare className="size-3.5" /> Comment
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(postLink);
          showToast({ title: "Link copied", status: "success" });
        }}
        className="px-2 py-1 rounded hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <Share2 className="size-3.5" /> Share
      </button>
      <button
        onClick={handleSave}
        className={
          "px-2 py-1 rounded hover:bg-muted inline-flex items-center gap-1.5 transition-colors " +
          (isSaved ? "text-primary" : "hover:text-foreground")
        }
      >
        <Bookmark className={"size-3.5 " + (isSaved ? "fill-current" : "")} />
        {isSaved ? "Saved" : "Save"}
      </button>
      {(userIsCreator || userIsAdmin) && (
        <button
          disabled={loadingDelete}
          onClick={handleDelete}
          className="px-2 py-1 rounded hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      )}
    </div>
  );
}
```

## Task 4.5: Rewrite `PostItem` with `viewTransitionName` + Link wrap

**Files:**
- Modify: `components/posts/post-item/PostItem.tsx`

- [ ] **Step 1: Replace the file**

```tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";
import VoteSection from "./VoteSection";
import PostDetails from "./PostDetails";
import PostTitle from "./PostTitle";
import PostBody from "./PostBody";
import PostActions from "./PostActions";

type Props = {
  post: Post;
  userIsCreator: boolean;
  userIsAdmin?: boolean;
  userVoteValue?: number;
  onVote: (e: React.MouseEvent<SVGElement>, post: Post, vote: number, communityId: string) => void;
  onDeletePost: (post: Post) => Promise<boolean>;
  onSelectPost?: (post: Post) => void;
  showCommunityImage?: boolean;
  votingDisabled?: boolean;
  isVotePending?: boolean;
};

export default function PostItem({
  post, userIsCreator, userIsAdmin = false, userVoteValue, onVote, onDeletePost,
  onSelectPost, showCommunityImage, votingDisabled, isVotePending,
}: Props) {
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const showToast = useCustomToast();
  const { onSavePost, isPostSaved } = useSavedPosts();
  const isSaved = isPostSaved(post.id!);
  const singlePostPage = !onSelectPost;
  const href = `/c/${post.communityId}/posts/${post.id}`;

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoadingDelete(true);
    try {
      const ok = await onDeletePost(post);
      if (!ok) throw new Error("delete failed");
      showToast({ title: "Post deleted", status: "success" });
      if (singlePostPage) router.push(post.communityId ? `/c/${post.communityId}` : "/");
    } catch {
      showToast({ title: "Couldn't delete the post", status: "error" });
    } finally {
      setLoadingDelete(false);
      setConfirmOpen(false);
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await onSavePost(post);
  };

  return (
    <article
      className="group bg-card border border-border rounded-xl flex gap-3 p-3 shadow-sm hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.25)] transition-all"
      style={{
        // shared element name for view-transition morph in Phase 5
        viewTransitionName: `post-${post.id}`,
      }}
    >
      <div style={{ viewTransitionName: `vote-${post.id}` }}>
        <VoteSection
          userVoteValue={userVoteValue}
          onVote={onVote}
          post={post}
          votingDisabled={votingDisabled}
          isVotePending={isVotePending}
        />
      </div>
      <div className="flex-1 min-w-0">
        <PostDetails post={post} showCommunityImage={showCommunityImage} />
        <Link href={href} className="block" style={{ viewTransitionName: `title-${post.id}` }}>
          <PostTitle post={post} />
        </Link>
        <PostBody post={post} loadingImage={loadingImage} setLoadingImage={setLoadingImage} />
        <PostActions
          handleDelete={handleDeleteClick}
          loadingDelete={loadingDelete}
          userIsCreator={userIsCreator}
          userIsAdmin={userIsAdmin}
          postLink={href}
          handleSave={handleSave}
          isSaved={isSaved}
          showToast={showToast}
        />
        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete post?"
          body="This can't be undone."
          confirmButtonText="Delete"
          isLoading={loadingDelete}
        />
      </div>
    </article>
  );
}
```

Note: `ConfirmationDialog` is still Chakra at this point; rewritten in Phase 7. It will still render correctly via the coexisting providers.

## Task 4.6: Rewrite `Posts` (the feed list)

**Files:**
- Modify: `components/posts/Posts.tsx`

- [ ] **Step 1: Replace** — read the current file, port its logic, swap container chakra primitives for `<div>` + Tailwind.

Open `components/posts/Posts.tsx`, replace the outer `<Stack>` / `<Flex>` with `<div className="space-y-3">`. Keep all the data-hook calls and `PostItem` props identical. (The existing logic is already TanStack-Query-driven from Phase C; this task is just a styling swap.)

## Task 4.7: Rewrite the post loaders

**Files:**
- Modify: `components/loaders/post-loader/PostLoader.tsx`
- Modify: `components/loaders/post-loader/PostLoaderItem.tsx`
- Modify: `components/loaders/CommunityLoader.tsx`

- [ ] **Step 1: `PostLoaderItem.tsx`**

```tsx
type Props = { height: string };

export default function PostLoaderItem({ height }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
      <div className="skel-jade h-3 w-2/5 mt-3 rounded" />
      <div className="skel-jade h-3 w-full mt-3 rounded" />
      <div className="skel-jade h-3 w-full mt-1.5 rounded" />
      <div className="skel-jade h-3 w-3/5 mt-1.5 rounded" />
      <div className="skel-jade mt-3 rounded" style={{ height }} />
    </div>
  );
}
```

- [ ] **Step 2: `PostLoader.tsx`** — port without behavior changes; replace any Chakra `<Stack>` with `<div className="space-y-3">`.

- [ ] **Step 3: `CommunityLoader.tsx`** — same pattern: replace Chakra layout primitives with Tailwind divs.

## Task 4.8: Rewrite home page (`app/page.tsx`) and `HomePageClient.tsx`

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/HomePageClient.tsx`

- [ ] **Step 1: Read both files to understand their data flow**

```powershell
cat app/page.tsx
cat app/HomePageClient.tsx
```

- [ ] **Step 2: Update `HomePageClient.tsx`** — swap outer Chakra primitives for Tailwind divs. The TanStack Query hooks stay. The feed renders through the already-migrated `<Posts>`.

- [ ] **Step 3: Update `app/page.tsx`** to remove the Phase 1 smoke button completely if any residue remains, and to drop any Chakra layout wrappers.

## Task 4.9: Rewrite community page (`app/c/[communityId]/page.tsx` + `CommunityClientPage.tsx`)

**Files:**
- Modify: `app/c/[communityId]/page.tsx`
- Modify: `app/community/[communityId]/comments/CommunityClientPage.tsx` (rename and move to `app/c/[communityId]/CommunityClient.tsx`)
- Create: `components/community/CommunityHeader.tsx` (new — jade gradient banner)
- Modify: `components/community/community-header/CommunityHeader.tsx` (legacy — kept for now if it's imported elsewhere; not used on the new route)

- [ ] **Step 1: Move the community client**

```powershell
New-Item -ItemType File -Force -Path "app/c/[communityId]/CommunityClient.tsx" | Out-Null
```

Copy the current `CommunityClientPage.tsx` content into the new file, rename the default export to `CommunityClient`, and rewrite the JSX using Tailwind primitives (swap `<Flex>`, `<Box>`, `<Stack>` for `<div>`).

- [ ] **Step 2: Create the new community header**

```tsx
// components/community/CommunityHeader.tsx
import { Button } from "@/components/ui/button";
import { Community } from "@/types/community";

type Props = {
  community: Community;
  isJoined: boolean;
  onToggleJoin: () => void;
};

export default function CommunityHeader({ community, isJoined, onToggleJoin }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white mb-3"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 60%, hsl(var(--primary-soft)) 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 90% 30%, rgba(255,255,255,0.18), transparent 50%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-lg font-semibold tracking-tight">c/{community.id}</h1>
          <p className="text-xs opacity-85 mt-0.5">A place for considered discussion.</p>
          <div className="text-[11px] opacity-75 mt-2.5 flex gap-3">
            <span>{community.numberOfMembers ?? 0} members</span>
          </div>
        </div>
        <Button
          onClick={onToggleJoin}
          className="bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-sm"
        >
          {isJoined ? "✓ Joined" : "Join"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the header into `CommunityClient.tsx`** and update `app/c/[communityId]/page.tsx` to import from the new path:

```tsx
import CommunityClient from "./CommunityClient";

type Props = { params: Promise<{ communityId: string }> };

export default async function CommunityRoute({ params }: Props) {
  const { communityId } = await params;
  return <CommunityClient communityId={communityId} />;
}
```

- [ ] **Step 4: Delete the legacy `app/community/[communityId]/comments/CommunityClientPage.tsx` and the old folder structure**

```powershell
Remove-Item -Recurse -Force "app/community"
```

(Routing-wise: the 308 redirects in `next.config.ts` cover the old `/community/[id]/*` paths. No `/community` folder needed.)

- [ ] **Step 5: Update the old community subcomponents** — `components/community/community-header/*`, `components/community/about/*`, `components/community/CreatePostLink.tsx`, etc. — to use Tailwind primitives. Or delete them if they're only consumed by the legacy `CommunityClientPage`. **`CreatePostLink.tsx` is deleted in Phase 6** — leave it in place for now since the existing client still uses it.

## Task 4.10: Phase 4 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Manual smoke** — `pnpm dev`, visit `/` and `/c/<community>`, click upvote/downvote on a post, verify spring pop + +1 ghost animation. Hover a post card — should lift 2px with jade border tint.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 4 — feed & post cards (shadcn + motion vote-pop + view-transition wiring)"
```

---

# Phase 5 — Post detail + comments

Set up intercepting routes for the overlay morph, build the new `PostDetail` page, build recursive `CommentNode` with depth-5 cutoff, build `ContinueThreadButton` + the sub-thread route, write the inline reply composer, and add the TDD-worthy unit tests for depth tracking and URL building.

## Task 5.1: Intercepting routes scaffold

**Files:**
- Modify: `app/c/[communityId]/layout.tsx` (add `@modal` slot)
- Create: `app/c/[communityId]/@modal/default.tsx`
- Create: `app/c/[communityId]/@modal/(.)posts/[pid]/page.tsx`
- Create: `app/c/[communityId]/posts/[pid]/page.tsx`

- [ ] **Step 1: Layout adds the `@modal` slot**

```tsx
// app/c/[communityId]/layout.tsx
import { ReactNode } from "react";

export default function CommunityLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return <>{children}{modal}</>;
}
```

- [ ] **Step 2: Default fallback for the `@modal` slot when not intercepting**

```tsx
// app/c/[communityId]/@modal/default.tsx
export default function Default() { return null; }
```

- [ ] **Step 3: Real post-detail page (loaded on direct URL)**

```tsx
// app/c/[communityId]/posts/[pid]/page.tsx
import PostDetail from "@/components/posts/post-detail/PostDetail";

type Props = { params: Promise<{ communityId: string; pid: string }> };

export default async function PostDetailRoute({ params }: Props) {
  const { communityId, pid } = await params;
  return <PostDetail communityId={communityId} postId={pid} layout="page" />;
}
```

- [ ] **Step 4: Intercepting overlay variant**

```tsx
// app/c/[communityId]/@modal/(.)posts/[pid]/page.tsx
"use client";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import PostDetail from "@/components/posts/post-detail/PostDetail";
import { useParams } from "next/navigation";

export default function PostOverlayRoute() {
  const router = useRouter();
  const params = useParams<{ communityId: string; pid: string }>();
  return (
    <Dialog open onOpenChange={(v) => { if (!v) router.back(); }}>
      <DialogContent className="max-w-[760px] max-h-[88vh] overflow-y-auto p-0">
        <VisuallyHidden><DialogTitle>Post detail</DialogTitle></VisuallyHidden>
        <PostDetail
          communityId={params.communityId}
          postId={params.pid}
          layout="overlay"
        />
      </DialogContent>
    </Dialog>
  );
}
```

If `@radix-ui/react-visually-hidden` isn't a direct dep, install it:
```powershell
pnpm add @radix-ui/react-visually-hidden
```

## Task 5.2: `PostDetail` shell

**Files:**
- Create: `components/posts/post-detail/PostDetail.tsx`

- [ ] **Step 1: Write the shell**

```tsx
"use client";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Skeleton } from "@/components/ui/skeleton";
import PostDetailHeader from "./PostDetailHeader";
import Comments from "./Comments";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  communityId: string;
  postId: string;
  layout: "page" | "overlay";
};

export default function PostDetail({ communityId, postId, layout }: Props) {
  const { data: post, isLoading } = usePostQuery({ postId });

  return (
    <div className="bg-card">
      {layout === "page" && (
        <div className="sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 flex items-center gap-2.5">
          <Link
            href={`/c/${communityId}`}
            className="size-7 rounded-full bg-muted hover:bg-primary-mute hover:text-primary flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="text-[10.5px] font-mono text-muted-foreground truncate">
            forum.projectconfucius.id/c/{communityId}/posts/{postId}
          </span>
        </div>
      )}
      <div className="p-4 space-y-3">
        {isLoading || !post
          ? <Skeleton className="h-32 w-full skel-jade rounded-xl" />
          : <PostDetailHeader post={post} />}
      </div>
      <Comments postId={postId} communityId={communityId} />
    </div>
  );
}
```

The `usePostQuery` hook should already exist from Phase C. If it has a different name (`useGetPostByIdQuery`, etc.), grep `lib/queries/posts/` and use it.

- [ ] **Step 2: Write `PostDetailHeader.tsx`** — same post card layout as feed but with bigger title and full body

```tsx
import { Post } from "@/types/post";
import moment from "moment";

export default function PostDetailHeader({ post }: { post: Post }) {
  return (
    <article
      className="bg-card border border-border rounded-xl p-4 flex gap-3.5"
      style={{ viewTransitionName: `post-${post.id}` }}
    >
      {/* vote rail same shape as feed; reuses VoteSection ideally; simplified static here for brevity */}
      <div style={{ viewTransitionName: `vote-${post.id}` }} className="w-9">
        {/* For full interactivity, swap with <VoteSection> wired to mutations; see Task 4.3 */}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] text-muted-foreground mb-1">
          <span className="text-primary font-semibold">c/{post.communityId}</span>
          {" · "}{moment(post.createdAt).fromNow()}{" · "}
          <span className="font-serif italic">u/{post.creatorDisplayName}</span>
        </div>
        <h1
          className="font-serif font-semibold text-[22px] leading-tight tracking-[-0.01em] mb-2"
          style={{ viewTransitionName: `title-${post.id}` }}
        >
          {post.title}
        </h1>
        {post.body && (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{post.body}</p>
        )}
      </div>
    </article>
  );
}
```

(Wire `<VoteSection>` here too for full interactivity — use the same component from Phase 4 with the same prop shape; pull `userVoteValue` from `useUserVotesQuery`.)

## Task 5.3: TDD — `ContinueThreadButton` URL builder

**Files:**
- Create: `lib/utils/comment-url.ts`
- Create: `__tests__/lib/comment-url.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/comment-url.test.ts
import { describe, it, expect } from "vitest";
import { buildCommentUrl } from "@/lib/utils/comment-url";

describe("buildCommentUrl", () => {
  it("builds the canonical sub-thread URL", () => {
    expect(buildCommentUrl("philosophy", "post-1", "cmt-99"))
      .toBe("/c/philosophy/posts/post-1/comment/cmt-99");
  });

  it("encodes URI-unsafe characters in the community id", () => {
    expect(buildCommentUrl("a b", "p", "c")).toBe("/c/a%20b/posts/p/comment/c");
  });

  it("throws if any segment is empty", () => {
    expect(() => buildCommentUrl("", "p", "c")).toThrow();
    expect(() => buildCommentUrl("c", "", "c")).toThrow();
    expect(() => buildCommentUrl("c", "p", "")).toThrow();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```powershell
pnpm test __tests__/lib/comment-url.test.ts
```
Expected: FAIL — `buildCommentUrl` not defined.

- [ ] **Step 3: Write the implementation**

```ts
// lib/utils/comment-url.ts
export function buildCommentUrl(
  communityId: string,
  postId: string,
  commentId: string,
): string {
  if (!communityId || !postId || !commentId) {
    throw new Error("buildCommentUrl: empty segment");
  }
  return `/c/${encodeURIComponent(communityId)}/posts/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}`;
}
```

- [ ] **Step 4: Run — verify it passes**

```powershell
pnpm test __tests__/lib/comment-url.test.ts
```
Expected: PASS, 3/3.

## Task 5.4: TDD — `CommentNode` depth + collapse logic

**Files:**
- Create: `lib/utils/comment-tree.ts` (pure tree helpers — depth limit, descendant count)
- Create: `__tests__/lib/comment-tree.test.ts`

- [ ] **Step 1: Failing test**

```ts
// __tests__/lib/comment-tree.test.ts
import { describe, it, expect } from "vitest";
import { countDescendants, shouldCutoff, MAX_INLINE_DEPTH } from "@/lib/utils/comment-tree";

type C = { id: string; children?: C[] };

describe("comment-tree", () => {
  it("countDescendants returns total nested count", () => {
    const tree: C = { id: "a", children: [
      { id: "b", children: [{ id: "c" }] },
      { id: "d" },
    ]};
    expect(countDescendants(tree)).toBe(3);
  });

  it("countDescendants returns 0 for leaf", () => {
    expect(countDescendants({ id: "x" })).toBe(0);
  });

  it("shouldCutoff true at MAX_INLINE_DEPTH and beyond", () => {
    expect(shouldCutoff(MAX_INLINE_DEPTH - 1)).toBe(false);
    expect(shouldCutoff(MAX_INLINE_DEPTH)).toBe(true);
    expect(shouldCutoff(MAX_INLINE_DEPTH + 3)).toBe(true);
  });

  it("MAX_INLINE_DEPTH is 5", () => {
    expect(MAX_INLINE_DEPTH).toBe(5);
  });
});
```

- [ ] **Step 2: Run — fail**

```powershell
pnpm test __tests__/lib/comment-tree.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/utils/comment-tree.ts
export const MAX_INLINE_DEPTH = 5;

type WithChildren = { children?: WithChildren[] };

export function countDescendants(node: WithChildren): number {
  if (!node.children?.length) return 0;
  return node.children.reduce(
    (sum, c) => sum + 1 + countDescendants(c),
    0,
  );
}

export function shouldCutoff(depth: number): boolean {
  return depth >= MAX_INLINE_DEPTH;
}
```

- [ ] **Step 4: Run — pass**

```powershell
pnpm test __tests__/lib/comment-tree.test.ts
```
Expected: PASS, 4/4.

## Task 5.5: `CommentNode` (recursive)

**Files:**
- Create: `components/posts/post-detail/CommentNode.tsx`
- Create: `components/posts/post-detail/ContinueThreadButton.tsx`
- Create: `components/posts/post-detail/RepliesSummary.tsx`
- Create: `components/posts/post-detail/InlineReplyComposer.tsx`

- [ ] **Step 1: `RepliesSummary.tsx`**

```tsx
type Props = { count: number };
export default function RepliesSummary({ count }: Props) {
  return (
    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[10.5px] font-semibold px-2 py-0.5 rounded-full ml-1.5">
      <span className="text-primary font-bold">+</span>
      {count} {count === 1 ? "reply" : "replies"}
    </span>
  );
}
```

- [ ] **Step 2: `ContinueThreadButton.tsx`**

```tsx
import Link from "next/link";
import { buildCommentUrl } from "@/lib/utils/comment-url";

type Props = { communityId: string; postId: string; commentId: string; hiddenCount: number };

export default function ContinueThreadButton({ communityId, postId, commentId, hiddenCount }: Props) {
  return (
    <Link
      href={buildCommentUrl(communityId, postId, commentId)}
      className="mt-1.5 flex items-center justify-between rounded-lg px-3 py-2 border border-dashed border-primary-soft bg-gradient-to-br from-primary-mute to-primary-mute/50 hover:border-primary group transition-all"
    >
      <div>
        <div className="text-[11.5px] font-semibold text-primary">Continue this thread</div>
        {hiddenCount > 0 && (
          <div className="text-[10px] text-muted-foreground">{hiddenCount} more replies</div>
        )}
      </div>
      <span className="text-primary text-sm group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );
}
```

- [ ] **Step 3: `InlineReplyComposer.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";

type Props = { postId: string; parentId: string | null; onDone?: () => void };

export default function InlineReplyComposer({ postId, parentId, onDone }: Props) {
  const [text, setText] = useState("");
  const create = useCreateCommentMutation();
  const submitting = create.isPending;
  const submit = async () => {
    if (!text.trim()) return;
    await create.mutateAsync({ postId, parentId, text: text.trim() });
    setText("");
    onDone?.();
  };
  return (
    <div className="bg-muted/40 border border-border rounded-lg p-2.5 mt-1.5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply…"
        rows={3}
        className="bg-transparent border-0 focus-visible:ring-0 resize-none p-0 text-[12.5px]"
      />
      <div className="flex justify-end gap-2 mt-1.5">
        <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" disabled={!text.trim() || submitting} onClick={submit}>
          {submitting ? "Replying…" : "Reply"}
        </Button>
      </div>
    </div>
  );
}
```

If `useCreateCommentMutation` isn't a Phase-C hook, create a thin one that calls the existing `createComment` action.

- [ ] **Step 4: `CommentNode.tsx`** — the recursive renderer

```tsx
"use client";
import { useState } from "react";
import moment from "moment";
import { Comment } from "@/types/comment";
import { MAX_INLINE_DEPTH, countDescendants } from "@/lib/utils/comment-tree";
import ContinueThreadButton from "./ContinueThreadButton";
import RepliesSummary from "./RepliesSummary";
import InlineReplyComposer from "./InlineReplyComposer";

type Props = {
  comment: Comment & { children?: Comment[] };
  depth: number;
  communityId: string;
  postId: string;
  postAuthorId?: string;
};

export default function CommentNode({
  comment, depth, communityId, postId, postAuthorId,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const isOP = !!postAuthorId && comment.creatorId === postAuthorId;
  const hiddenCount = collapsed ? countDescendants(comment) : 0;
  const cutoff = depth >= MAX_INLINE_DEPTH;

  return (
    <div className="flex gap-2 py-1">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand thread" : "Collapse thread"}
        className="group/spine w-4 shrink-0 flex justify-center pt-7"
      >
        <span className="block w-0.5 flex-1 rounded bg-primary/20 group-hover/spine:bg-primary group-hover/spine:w-[3px] transition-all" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] mb-0.5">
          <span className={isOP ? "font-bold text-primary" : "font-bold text-foreground"}>
            u/{comment.creatorDisplayText}
          </span>
          {isOP && (
            <span className="bg-primary text-primary-foreground text-[8.5px] font-extrabold px-1 py-px rounded uppercase tracking-wider">
              OP
            </span>
          )}
          <span className="text-muted-foreground text-[10.5px]">{moment(comment.createdAt).fromNow()}</span>
          {collapsed && <RepliesSummary count={hiddenCount} />}
        </div>
        {!collapsed && (
          <>
            <p className="text-[12.5px] leading-relaxed">{comment.text}</p>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground text-[10.5px] font-semibold">
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="px-2 py-1 rounded hover:bg-primary-mute hover:text-primary transition-colors"
              >
                Reply
              </button>
            </div>
            {replyOpen && (
              <InlineReplyComposer
                postId={postId}
                parentId={comment.id ?? null}
                onDone={() => setReplyOpen(false)}
              />
            )}
            {(comment.children?.length ?? 0) > 0 && (
              <>
                {cutoff ? (
                  <ContinueThreadButton
                    communityId={communityId}
                    postId={postId}
                    commentId={comment.id!}
                    hiddenCount={countDescendants(comment)}
                  />
                ) : (
                  <div className="ml-4 border-l-2 border-primary/20 pl-2 mt-1.5">
                    {comment.children!.map((child) => (
                      <CommentNode
                        key={child.id}
                        comment={child as Comment & { children?: Comment[] }}
                        depth={depth + 1}
                        communityId={communityId}
                        postId={postId}
                        postAuthorId={postAuthorId}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

## Task 5.6: `Comments` container + sort bar

**Files:**
- Create: `components/posts/post-detail/Comments.tsx`
- Create: `components/posts/post-detail/CommentsSortBar.tsx`

- [ ] **Step 1: `CommentsSortBar.tsx`**

```tsx
"use client";
import { cn } from "@/lib/utils";

const SORTS = ["best", "new", "top", "controversial"] as const;
type Sort = typeof SORTS[number];

type Props = { value: Sort; onChange: (v: Sort) => void };

export default function CommentsSortBar({ value, onChange }: Props) {
  return (
    <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-lg bg-card border border-border p-1.5">
      <span className="text-xs text-muted-foreground mr-1.5">Sort by</span>
      {SORTS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors",
            value === s ? "bg-primary-mute text-primary" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `Comments.tsx`** — fetches & renders

```tsx
"use client";
import { useState } from "react";
import { useCommentsQuery } from "@/lib/queries/comments/use-comments";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import CommentNode from "./CommentNode";
import CommentsSortBar from "./CommentsSortBar";
import InlineReplyComposer from "./InlineReplyComposer";

type Sort = "best" | "new" | "top" | "controversial";

export default function Comments({ postId, communityId }: { postId: string; communityId: string }) {
  const [sort, setSort] = useState<Sort>("best");
  const { data: comments } = useCommentsQuery({ postId, sort });
  const { data: post } = usePostQuery({ postId });

  return (
    <div className="bg-background py-2">
      <CommentsSortBar value={sort} onChange={setSort} />
      <div className="px-4 mb-3">
        <InlineReplyComposer postId={postId} parentId={null} />
      </div>
      <div className="space-y-2 px-4 pb-4">
        {(comments ?? []).map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-3">
            <CommentNode
              comment={c}
              depth={0}
              communityId={communityId}
              postId={postId}
              postAuthorId={post?.creatorId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

If `useCommentsQuery` doesn't already return nested children, you need a server-side tree builder. Check `lib/actions/comments/` for the existing comment fetcher and adapt it to return `{ comment, children: [...] }` recursively up to depth 5. Out of scope here if Phase C left this as flat — add a tree-builder helper in `lib/utils/comment-tree.ts` (alongside existing exports) that takes flat comments and turns them into nested.

## Task 5.7: Sub-thread route

**Files:**
- Create: `app/c/[communityId]/posts/[pid]/comment/[cid]/page.tsx`
- Create: `components/posts/post-detail/SubThreadView.tsx`

- [ ] **Step 1: Route page**

```tsx
import SubThreadView from "@/components/posts/post-detail/SubThreadView";

type Props = { params: Promise<{ communityId: string; pid: string; cid: string }> };

export default async function SubThreadRoute({ params }: Props) {
  const { communityId, pid, cid } = await params;
  return <SubThreadView communityId={communityId} postId={pid} rootCommentId={cid} />;
}
```

- [ ] **Step 2: View component**

```tsx
"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCommentByIdQuery } from "@/lib/queries/comments/use-comment-by-id";
import CommentNode from "./CommentNode";

type Props = { communityId: string; postId: string; rootCommentId: string };

export default function SubThreadView({ communityId, postId, rootCommentId }: Props) {
  const { data: rootComment } = useCommentByIdQuery({ commentId: rootCommentId });

  return (
    <div className="bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 flex items-center gap-2.5">
        <Link
          href={`/c/${communityId}/posts/${postId}`}
          className="size-7 rounded-full bg-muted hover:bg-primary-mute hover:text-primary flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-[10.5px] font-mono text-muted-foreground truncate">
          /c/{communityId}/posts/{postId}/comment/{rootCommentId}
        </span>
      </div>
      <div className="mx-4 my-3 px-3 py-2 bg-primary-mute border border-primary-soft rounded-lg text-[11px] text-primary-deep">
        <Link href={`/c/${communityId}/posts/${postId}`} className="text-primary font-semibold underline underline-offset-2">
          ← Full thread
        </Link>
        {" · "}Showing replies to <strong>u/{rootComment?.creatorDisplayText ?? "…"}</strong>
      </div>
      <div className="px-4 pb-4">
        {rootComment && (
          <div className="bg-card border border-border rounded-xl p-3">
            <CommentNode
              comment={rootComment}
              depth={0}
              communityId={communityId}
              postId={postId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

If `useCommentByIdQuery` doesn't exist, create it (a thin wrapper around an existing fetch).

## Task 5.8: Wire the existing comment-fetching action into the new shape

**Files:**
- Modify: existing comment server actions to return a tree shape OR add a client-side tree builder.

- [ ] **Step 1: Check the current shape**

```powershell
pnpm exec rg "comments" --files-with-matches lib/queries lib/actions hooks/comments
```
Read the fetcher. If comments come back flat (array with `parentId`), add a tree-builder:

```ts
// in lib/utils/comment-tree.ts — append
type FlatComment = { id: string; parentId: string | null };
export function buildCommentTree<T extends FlatComment>(flat: T[]): (T & { children: T[] })[] {
  const byId = new Map<string, T & { children: T[] }>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });
  const roots: (T & { children: T[] })[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children.push(c);
    else roots.push(c);
  }
  return roots;
}
```

Add a test for it in `__tests__/lib/comment-tree.test.ts`:
```ts
it("buildCommentTree assembles parent→children", () => {
  const tree = buildCommentTree([
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ]);
  expect(tree).toHaveLength(1);
  expect(tree[0].children[0].id).toBe("b");
  expect(tree[0].children[0].children[0].id).toBe("c");
});
```

Then wire it into `useCommentsQuery` (build the tree client-side after the flat fetch).

## Task 5.9: Phase 5 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Manual smoke** — `pnpm dev`, click a post from the community feed. Expected: overlay slides up (or transitions per browser), URL updates to `/c/<id>/posts/<pid>`. ESC closes back to feed. Click a deeply-nested comment's "Continue this thread →" — navigates to `/comment/<cid>` route. Browser back returns to the overlay state.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 5 — post detail overlay + Reddit-style threaded comments (depth 5 + Continue-this-thread)"
```

---

# Phase 6 — Inline-expand composer + create-post overhaul

Replace the deceptive `CreatePostLink` (fake-input that nav'd to `/submit`) with an inline-expand composer at the top of every community feed. Add a modal composer triggered by the navbar "+" button. Delete the entire `/submit` route and its supporting files. Optimistic insert with 3-second jade glow on the new post.

## Task 6.1: TDD — composer state machine

**Files:**
- Create: `lib/composer/state.ts`
- Create: `__tests__/composer/state.test.ts`

- [ ] **Step 1: Failing test**

```ts
// __tests__/composer/state.test.ts
import { describe, it, expect } from "vitest";
import { composerReducer, initialComposerState, type ComposerAction } from "@/lib/composer/state";

describe("composerReducer", () => {
  it("starts closed", () => {
    expect(initialComposerState.phase).toBe("closed");
    expect(initialComposerState.tab).toBe("text");
  });

  it("OPEN → open", () => {
    const s = composerReducer(initialComposerState, { type: "OPEN" });
    expect(s.phase).toBe("open");
  });

  it("CANCEL from open → closed and resets fields", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SET_TITLE", title: "Hi" });
    s = composerReducer(s, { type: "CANCEL" });
    expect(s.phase).toBe("closed");
    expect(s.title).toBe("");
  });

  it("SUBMIT → submitting; SUBMIT_OK → closed and reset", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SET_TITLE", title: "X" });
    s = composerReducer(s, { type: "SUBMIT" });
    expect(s.phase).toBe("submitting");
    s = composerReducer(s, { type: "SUBMIT_OK" });
    expect(s.phase).toBe("closed");
    expect(s.title).toBe("");
  });

  it("SUBMIT_ERROR returns to open with error message", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SUBMIT" });
    s = composerReducer(s, { type: "SUBMIT_ERROR", message: "nope" });
    expect(s.phase).toBe("open");
    expect(s.error).toBe("nope");
  });

  it("SET_TAB updates tab", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SET_TAB", tab: "image" });
    expect(s.tab).toBe("image");
  });
});
```

- [ ] **Step 2: Run — fail**

```powershell
pnpm test __tests__/composer/state.test.ts
```

- [ ] **Step 3: Implement**

```ts
// lib/composer/state.ts
export type ComposerTab = "text" | "image" | "link";
export type ComposerPhase = "closed" | "open" | "submitting";

export type ComposerState = {
  phase: ComposerPhase;
  tab: ComposerTab;
  title: string;
  body: string;
  error: string | null;
};

export const initialComposerState: ComposerState = {
  phase: "closed",
  tab: "text",
  title: "",
  body: "",
  error: null,
};

export type ComposerAction =
  | { type: "OPEN" }
  | { type: "CANCEL" }
  | { type: "SET_TAB"; tab: ComposerTab }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_BODY"; body: string }
  | { type: "SUBMIT" }
  | { type: "SUBMIT_OK" }
  | { type: "SUBMIT_ERROR"; message: string };

export function composerReducer(s: ComposerState, a: ComposerAction): ComposerState {
  switch (a.type) {
    case "OPEN":         return { ...s, phase: "open", error: null };
    case "CANCEL":       return { ...initialComposerState, tab: s.tab };
    case "SET_TAB":      return { ...s, tab: a.tab };
    case "SET_TITLE":    return { ...s, title: a.title };
    case "SET_BODY":     return { ...s, body: a.body };
    case "SUBMIT":       return { ...s, phase: "submitting", error: null };
    case "SUBMIT_OK":    return { ...initialComposerState };
    case "SUBMIT_ERROR": return { ...s, phase: "open", error: a.message };
  }
}
```

- [ ] **Step 4: Run — pass**

```powershell
pnpm test __tests__/composer/state.test.ts
```
Expected: PASS, 6/6.

## Task 6.2: `InlineComposer` component

**Files:**
- Create: `components/posts/composer/InlineComposer.tsx`
- Create: `components/posts/composer/RestrictedComposerNotice.tsx`

- [ ] **Step 1: `RestrictedComposerNotice.tsx`**

```tsx
import { Button } from "@/components/ui/button";

export default function RestrictedComposerNotice({ communityId }: { communityId: string }) {
  return (
    <div className="bg-muted/40 border border-dashed border-border rounded-xl px-4 py-3.5 mb-2 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Members only — join c/{communityId} to post.
      </span>
      <Button size="sm" variant="outline">Join</Button>
    </div>
  );
}
```

- [ ] **Step 2: `InlineComposer.tsx`**

```tsx
"use client";
import { useReducer, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageIcon, Link as LinkIcon, FileText } from "lucide-react";
import { composerReducer, initialComposerState, type ComposerTab } from "@/lib/composer/state";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post-mutation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

type Props = { communityId: string };

const TABS: { id: ComposerTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "text",  label: "Text",  Icon: FileText },
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "link",  label: "Link",  Icon: LinkIcon },
];

export default function InlineComposer({ communityId }: Props) {
  const [s, dispatch] = useReducer(composerReducer, initialComposerState);
  const titleRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const create = useCreatePostMutation();

  useEffect(() => { if (s.phase === "open") titleRef.current?.focus(); }, [s.phase]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && s.phase !== "closed") dispatch({ type: "CANCEL" });
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && s.phase === "open" && s.title.trim()) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const submit = async () => {
    if (!s.title.trim()) return;
    dispatch({ type: "SUBMIT" });
    try {
      await create.mutateAsync({ communityId, title: s.title.trim(), body: s.body });
      dispatch({ type: "SUBMIT_OK" });
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", message: (e as Error).message });
    }
  };

  const initials = (session?.user?.name ?? "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      layout
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
      className={
        "bg-card border rounded-xl overflow-hidden mb-3 transition-colors " +
        (s.phase !== "closed"
          ? "border-primary-soft shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.18)]"
          : "border-border")
      }
    >
      <div className="flex items-center gap-3 px-3.5 py-3 cursor-text" onClick={() => dispatch({ type: "OPEN" })}>
        <Avatar className="size-8 shrink-0">
          {session?.user?.image && <AvatarImage src={session.user.image} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex-1 text-[12.5px] text-muted-foreground">
          Start a discussion in <strong className="text-foreground">c/{communityId}</strong>…
        </span>
        <div className="flex gap-1 text-muted-foreground">
          <button className="size-8 rounded-md hover:bg-primary-mute hover:text-primary inline-flex items-center justify-center transition-colors">
            <ImageIcon className="size-4" />
          </button>
          <button className="size-8 rounded-md hover:bg-primary-mute hover:text-primary inline-flex items-center justify-center transition-colors">
            <LinkIcon className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {s.phase !== "closed" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <div className="flex gap-1 px-3.5 border-b border-border">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => dispatch({ type: "SET_TAB", tab: id })}
                  className={
                    "px-3.5 py-2 text-[12px] font-semibold flex items-center gap-1.5 border-b-2 -mb-px transition-colors " +
                    (s.tab === id
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground")
                  }
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <div className="px-3.5 py-3">
              <input
                ref={titleRef}
                value={s.title}
                onChange={(e) => dispatch({ type: "SET_TITLE", title: e.target.value })}
                placeholder="Title — be specific"
                maxLength={300}
                className="w-full bg-transparent border-0 outline-none font-serif text-[16px] font-semibold py-1.5"
              />
              <textarea
                value={s.body}
                onChange={(e) => dispatch({ type: "SET_BODY", body: e.target.value })}
                placeholder="What's on your mind? Markdown supported."
                rows={5}
                className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:bg-card transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                <span>Posting to <strong className="text-primary">c/{communityId}</strong></span>
                <span className={s.title.length > 250 ? "text-destructive" : ""}>{s.title.length} / 300</span>
              </div>
              {s.error && <div className="text-[11px] text-destructive mt-1">{s.error}</div>}
            </div>
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-muted/40 border-t border-border">
              <div className="text-[11px] text-muted-foreground">
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Ctrl</kbd>+
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Enter</kbd> to post
                {" · "}
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Esc</kbd> to cancel
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "CANCEL" })}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!s.title.trim() || s.phase === "submitting"}
                  onClick={submit}
                >
                  {s.phase === "submitting" ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

If `useCreatePostMutation` doesn't already exist in `lib/queries/posts/`, create it as a thin wrapper around the existing `createPost` action with `onSuccess` invalidating `posts.feed`.

## Task 6.3: Modal composer for the navbar "+" button

**Files:**
- Create: `components/posts/composer/ModalComposer.tsx`
- Modify: `components/posts/composer/ComposerLauncher.tsx` (was stubbed in Phase 3)

- [ ] **Step 1: `ModalComposer.tsx`** — wraps InlineComposer-style form in a Dialog with a community picker

```tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import InlineComposer from "./InlineComposer";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function ModalComposer({ open, onOpenChange }: Props) {
  const { data: snippets } = useCommunitySnippetsQuery({});
  const [selected, setSelected] = useState<string | null>(snippets?.[0]?.communityId ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-sm font-bold">New post</DialogTitle>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            className="mt-2 bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs"
          >
            <option value="">— pick a community —</option>
            {(snippets ?? []).map((s) => (
              <option key={s.communityId} value={s.communityId}>c/{s.communityId}</option>
            ))}
          </select>
        </DialogHeader>
        {selected && <InlineComposer communityId={selected} />}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Replace the Phase 3 stub `ComposerLauncher.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalComposer from "./ModalComposer";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

export function ComposerLauncher() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const path = usePathname() ?? "/";
  // Only show on home or non-community routes (community pages have the inline composer)
  if (path.startsWith("/c/")) return null;
  if (!session?.user) return null;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Create post">
        <Plus className="size-5" />
      </Button>
      <ModalComposer open={open} onOpenChange={setOpen} />
    </>
  );
}
```

## Task 6.4: Mount `<InlineComposer>` at top of community feed

**Files:**
- Modify: `app/c/[communityId]/CommunityClient.tsx`

- [ ] **Step 1: Add `<InlineComposer>` above the post list, gated on `canPost`**

Pseudo-code:
```tsx
import InlineComposer from "@/components/posts/composer/InlineComposer";
import RestrictedComposerNotice from "@/components/posts/composer/RestrictedComposerNotice";

// inside the render:
{canPost
  ? <InlineComposer communityId={communityId} />
  : <RestrictedComposerNotice communityId={communityId} />}
```

`canPost` comes from `useCommunityPermissions(community)` — already exists from earlier work.

## Task 6.5: Delete the `/submit` route + supporting files

**Files:** delete all of:
- `app/community/[communityId]/submit/page.tsx` (already gone if Phase 4 deleted `app/community`)
- `app/community/[communityId]/submit/SubmitPostClientPage.tsx`
- `components/posts/new-post-form/NewPostForm.tsx`
- `components/posts/new-post-form/BackToCommunityButton.tsx`
- `components/posts/new-post-form/PostCreateError.tsx`
- `components/posts/post-form/TextInputs.tsx`
- `components/community/CreatePostLink.tsx`

- [ ] **Step 1: Verify no remaining imports**

```powershell
pnpm exec rg "NewPostForm|CreatePostLink|BackToCommunityButton|PostCreateError|TextInputs" --type ts --type tsx
```
Expected: zero hits (if any, fix the imports first).

- [ ] **Step 2: Delete**

```powershell
Remove-Item -Force components/posts/new-post-form/NewPostForm.tsx, components/posts/new-post-form/BackToCommunityButton.tsx, components/posts/new-post-form/PostCreateError.tsx, components/posts/post-form/TextInputs.tsx, components/community/CreatePostLink.tsx
Remove-Item -Recurse -Force components/posts/new-post-form
```
Keep `components/posts/post-form/ImageUpload.tsx` — still used by `ImageCropModal`.

## Task 6.6: Optimistic-insert + jade-glow on the new post

**Files:**
- Modify: `lib/queries/posts/use-create-post-mutation.ts`
- Modify: `components/posts/post-item/PostItem.tsx` — add a one-time `.new-post-glow` class when post `id` matches a recently-created id.

- [ ] **Step 1: `useCreatePostMutation` — onMutate optimistically prepends the new post to the feed cache**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/actions/posts/createPost";
import { Post } from "@/types/post";

export function useCreatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { communityId: string; title: string; body: string }) =>
      createPost(vars.communityId, undefined, { title: vars.title, body: vars.body }, undefined),
    onSuccess: (newPost: Post) => {
      // mark as newly-created so PostItem applies new-post-glow once
      sessionStorage.setItem("pcf:newPost", newPost.id ?? "");
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}
```

(Adapt the `createPost` import path to whatever exists; preserve the existing post-create action signature.)

- [ ] **Step 2: `PostItem.tsx` — apply jade-glow once**

Inside `PostItem`, after `const isSaved = ...`:
```tsx
const [glow, setGlow] = useState(false);
useEffect(() => {
  const recent = sessionStorage.getItem("pcf:newPost");
  if (recent && recent === post.id) {
    setGlow(true);
    sessionStorage.removeItem("pcf:newPost");
    const t = setTimeout(() => setGlow(false), 3100);
    return () => clearTimeout(t);
  }
}, [post.id]);
```

Add `glow && "new-post-glow"` to the article className.

## Task 6.7: Phase 6 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Manual smoke** — create a post via the inline composer. New post should appear at the top of the feed within ~200 ms and glow jade for 3 seconds before settling.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 6 — inline-expand composer + modal composer + delete /submit"
```

---

# Phase 7 — Modal → page conversions + remaining modal updates

Move modal-heavy IA (community settings, profile, saved, members) into dedicated pages. Convert the modals that genuinely should remain modals to shadcn `<Dialog>`. Update every navigation site that used to open a modal.

## Task 7.1: Rewrite `ConfirmationDialog` in shadcn

**Files:**
- Modify: `components/modal/ConfirmationDialog.tsx`

- [ ] **Step 1: Replace**

```tsx
"use client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
};

export default function ConfirmationDialog({
  open, onClose, onConfirm, title, body,
  confirmButtonText = "Confirm", cancelButtonText = "Cancel",
  isLoading = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading} onClick={onClose}>{cancelButtonText}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Working…" : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Task 7.2: Rewrite `CreateCommunityModal`, `ImageCropModal` in shadcn

**Files:**
- Modify: `components/modal/create-community/CreateCommunityModal.tsx`
- Modify: `components/modal/image-crop/ImageCropModal.tsx`
- Modify: `components/modal/create-community/CommunityNameSection.tsx`
- Modify: `components/modal/create-community/CommunityTypeOptions.tsx`
- Modify: `components/modal/create-community/CommunityTypeOption.tsx`

- [ ] **Step 1: Read each, then swap outer Chakra primitives**

Open each file, replace:
- `<DialogRoot>` / `<DialogContent>` etc. → shadcn `<Dialog>` family
- `<Button>` (Chakra) → shadcn `<Button>`
- `<Input>`, `<Box>`, `<Flex>`, `<Stack>`, `<Text>`, `<Separator>` → shadcn equivalent or Tailwind `<div>`

Preserve all the form/state logic.

## Task 7.3: `/settings/profile` page

**Files:**
- Create: `app/settings/layout.tsx`
- Create: `app/settings/profile/page.tsx`
- Create: `components/settings/ProfileSettings.tsx`
- Modify: `components/modal/profile/ProfileModal.tsx` → delete after migration
- Modify: `components/modal/profile/UserImageSection.tsx` → move to `components/settings/UserImageSection.tsx`
- Modify: `components/modal/profile/UserInfoSection.tsx` → move to `components/settings/UserInfoSection.tsx`

- [ ] **Step 1: Settings layout (left nav + main)**

```tsx
// app/settings/layout.tsx
import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[900px] px-3 py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
      <nav className="space-y-1 text-sm font-medium">
        <Link href="/settings/profile" className="block px-3 py-2 rounded-md hover:bg-muted">Profile</Link>
        <Link href="/saved" className="block px-3 py-2 rounded-md hover:bg-muted">Saved posts</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Profile page**

```tsx
// app/settings/profile/page.tsx
import ProfileSettings from "@/components/settings/ProfileSettings";
export default function Page() { return <ProfileSettings />; }
```

- [ ] **Step 3: `ProfileSettings.tsx`** — port the contents of `ProfileModal.tsx` (image upload + info form) into a non-modal layout, using shadcn primitives.

- [ ] **Step 4: Move image-crop usage** — the profile image upload uses `ImageCropModal`; keep the modal logic but call it from the page.

- [ ] **Step 5: Delete the old modal files after the page works**

```powershell
Remove-Item -Force components/modal/profile/ProfileModal.tsx
```

- [ ] **Step 6: Update every trigger** — grep for `ProfileModal` and replace open-modal handlers with `<Link href="/settings/profile">` navigation.

## Task 7.4: `/saved` page (was `SavedPostsModal`)

**Files:**
- Create: `app/saved/page.tsx`
- Create: `components/saved/SavedPostsList.tsx` (port the modal's contents)
- Delete: `components/modal/saved-posts/SavedPostsModal.tsx`

- [ ] **Step 1: Page + component, similar structure to profile** — drop into the settings layout shape (sidebar + main).

## Task 7.5: `/c/[id]/settings` with Tabs (was multi-section CommunitySettings modal)

**Files:**
- Create: `app/c/[communityId]/settings/page.tsx`
- Create: `components/community-settings/CommunitySettingsTabs.tsx`
- Move/repurpose: `components/modal/community-settings/AdminManager.tsx` → `components/community-settings/Admins.tsx`
- Move/repurpose: `components/modal/community-settings/DangerZone.tsx` → `components/community-settings/Danger.tsx`
- Move/repurpose: `components/modal/community-settings/ImageSettings.tsx` → `components/community-settings/ImageSettings.tsx`
- Move/repurpose: `components/modal/community-settings/PrivacySettings.tsx` → `components/community-settings/Privacy.tsx`
- Delete the old `CommunitySettings.tsx` modal wrapper + `ModalFooter.tsx`

- [ ] **Step 1: Page**

```tsx
// app/c/[communityId]/settings/page.tsx
import CommunitySettingsTabs from "@/components/community-settings/CommunitySettingsTabs";

type Props = { params: Promise<{ communityId: string }> };

export default async function Page({ params }: Props) {
  const { communityId } = await params;
  return <CommunitySettingsTabs communityId={communityId} />;
}
```

- [ ] **Step 2: Tabs shell**

```tsx
"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Privacy from "./Privacy";
import ImageSettings from "./ImageSettings";
import Admins from "./Admins";
import Danger from "./Danger";

export default function CommunitySettingsTabs({ communityId }: { communityId: string }) {
  return (
    <div className="mx-auto max-w-[760px] px-3 py-4">
      <h1 className="font-serif text-2xl mb-3">Community settings — c/{communityId}</h1>
      <Tabs defaultValue="privacy">
        <TabsList>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>
        <TabsContent value="privacy"><Privacy communityId={communityId} /></TabsContent>
        <TabsContent value="image"><ImageSettings communityId={communityId} /></TabsContent>
        <TabsContent value="admins"><Admins communityId={communityId} /></TabsContent>
        <TabsContent value="danger"><Danger communityId={communityId} /></TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Port each section** — open the four old modal section files, rewrite the JSX in shadcn + Tailwind, keep the data-mutation hooks unchanged.

- [ ] **Step 4: Update triggers** — replace any `openCommunitySettings()` callsite with `<Link href={`/c/${id}/settings`}>` or `router.push`.

- [ ] **Step 5: Delete the old modal-settings folder**

```powershell
Remove-Item -Recurse -Force components/modal/community-settings
```

## Task 7.6: `/c/[id]/members` page (was `CommunityMembersModal`)

**Files:**
- Create: `app/c/[communityId]/members/page.tsx`
- Create: `components/community/MembersList.tsx`
- Delete: `components/modal/community-members/CommunityMembersModal.tsx`

- [ ] **Step 1:** Same pattern as the saved-posts page. Port modal contents into a real page; update triggers.

## Task 7.7: Clean up modal atoms

**Files:**
- Modify: `atoms/uiAtom.ts`

- [ ] **Step 1: Identify modal-state atoms that are no longer needed**

```powershell
pnpm exec rg "uiAtom" --type ts --type tsx
```
Remove atoms that previously opened modals which are now pages (e.g. `profileModalAtom`, `savedPostsModalAtom`, `communitySettingsModalAtom`, `communityMembersModalAtom`). Keep ones that still gate genuine modals.

## Task 7.8: Phase 7 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Manual smoke** — open user menu, click Profile → goes to `/settings/profile`. Click Saved → `/saved`. From community page, navigate to settings + members. Confirm dialog works. Image crop works during image upload.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 7 — modals → pages (profile, saved, community-settings, members) + shadcn modal rewrites"
```

---

# Phase 8 — Teardown (remove Chakra + Emotion)

Final atomic removal of Chakra, Emotion, and the unused framer-motion 12.x. Everything must still build and pass green-gate after.

## Task 8.1: Drop ChakraProvider + EmotionRegistry from providers

**Files:**
- Modify: `app/providers.tsx`
- Modify: `components/ui/color-mode.tsx` (reduce to `next-themes` re-exports OR delete if unused)
- Delete: `app/emotion-registry.tsx`
- Delete: `components/ui/toaster.tsx` (the Chakra one — Sonner now handles toasts)
- Delete: `chakra/theme.ts`, `chakra/button.ts`, `chakra/` folder

- [ ] **Step 1: Replace `app/providers.tsx`**

```tsx
"use client";
import Layout from "@/components/layout/Layout";
import { QueryProvider } from "@/lib/queries/provider";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Layout>{children}</Layout>
          <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
        </ThemeProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}
```

- [ ] **Step 2: Decide on `color-mode.tsx`**

```powershell
pnpm exec rg "useColorMode|useColorModeValue" --type ts --type tsx
```
If zero hits → `Remove-Item components/ui/color-mode.tsx -Force`.
If any hits remain (likely in stale components you didn't refactor in earlier phases), either rewrite those call sites to use `useTheme()` from `next-themes` directly, or reduce `color-mode.tsx` to a thin re-export:
```tsx
"use client";
import { useTheme } from "next-themes";
export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(resolvedTheme === "light" ? "dark" : "light"),
  };
}
export function useColorModeValue<T>(light: T, dark: T) {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? dark : light;
}
```

- [ ] **Step 3: Delete the Chakra-derived UI files and the `chakra/` folder**

```powershell
Remove-Item -Force app/emotion-registry.tsx
Remove-Item -Force components/ui/toaster.tsx
Remove-Item -Recurse -Force chakra
```

- [ ] **Step 4: Delete `components/ui/CustomMenuButton.tsx`, `components/ui/Icon.tsx`, `components/ui/password-input.tsx`, `components/ui/ErrorMessage.tsx` if unused**

```powershell
pnpm exec rg "CustomMenuButton|password-input|ErrorMessage|/ui/Icon" --type ts --type tsx
```
Delete the ones with zero hits.

## Task 8.2: Remove Chakra/Emotion deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove the packages**

```powershell
pnpm remove @chakra-ui/react @emotion/cache @emotion/react @emotion/styled framer-motion @fontsource/open-sans
```

- [ ] **Step 2: Verify lock file updates**

```powershell
git diff pnpm-lock.yaml | head -40
```

## Task 8.3: Final grep — ensure no traces

- [ ] **Step 1: Search for any leftover Chakra/Emotion imports**

```powershell
pnpm exec rg "@chakra-ui|@emotion" --type ts --type tsx
```
Expected: zero matches.

- [ ] **Step 2: Search the css files**

```powershell
pnpm exec rg "@chakra-ui|@emotion" --type css
```
Expected: zero matches.

## Task 8.4: Phase 8 green-gate + commit

- [ ] **Step 1: Green gate**

```powershell
pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build
```

- [ ] **Step 2: Final manual smoke** — walk all primary flows: home, community feed, post detail overlay, sub-thread navigation, inline composer create, vote, save, sign-out, mobile sheet, dark mode toggle (via dropdown).

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat(forum,phase-d): Phase 8 — teardown (remove chakra, emotion, framer-motion, open-sans)"
```

---

# Task 9: Open the PR

- [ ] **Step 1: Push the branch**

```powershell
git push -u origin feat/phase-d-pcf-redesign
```

- [ ] **Step 2: Open the PR**

```powershell
gh pr create --title "Phase D — PCF redesign (Chakra → shadcn, Mountain Jade)" --body @"
## Summary
- Phase D of the de-Firebase migration: visual layer, IA, and layout reflow
- Migrates from Chakra UI v3 + Emotion + framer-motion 12.x (unused) to shadcn + Tailwind v4 + motion + sonner
- New visual language: Mountain Jade palette, Inter + Source Serif 4 typography, spring micro-interactions
- App renamed: ``projectconfucius forum`` (PCF in tight slots)
- Fixes the deceptive create-post flow with an inline-expand composer
- Post detail uses Next.js intercepting routes + View Transitions API for shared-element morph
- Reddit-style threaded comments: 5 inline depth + Continue-this-thread sub-route
- Modal-heavy IA flattened: community settings / profile / saved / members → dedicated pages

## Spec
docs/superpowers/specs/2026-05-21-forum-phase-d-pcf-redesign-design.md

## Test plan
- [ ] ``pnpm test ; pnpm typecheck ; pnpm lint ; pnpm build`` passes on the branch tip
- [ ] No imports of ``@chakra-ui`` or ``@emotion`` remain (``pnpm exec rg`` confirms)
- [ ] ``/`` (home), ``/c/[id]``, ``/c/[id]/posts/[pid]``, ``/c/[id]/posts/[pid]/comment/[cid]`` all load correctly
- [ ] 308 redirects from ``/community/[id]/*`` paths
- [ ] Inline composer creates a post optimistically; new post appears at top with jade glow
- [ ] Vote upvote/downvote: spring pop + +1 ghost
- [ ] Post-detail overlay morph works on click (or graceful crossfade on Firefox)
- [ ] Comment threading: 5 inline depth, Continue-this-thread navigates and back-button returns
- [ ] Profile, saved, community-settings, members all on real pages now (not modals)
- [ ] Mobile sheet works at <768px

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"@
```

(The PowerShell here-string above uses `@"..."@` because PS uses `@'..'@` for single-quoted; the embedded triple-backticks render literally. Adapt if `gh` is run from a different shell.)

- [ ] **Step 3: Capture the PR URL** — printed by `gh pr create`. Share it with the user.

---

# Spec-coverage self-check (for the plan author)

Cross-referencing the spec's sections against this plan:

- §2.1 Palette → Task 1.3 (globals.css tokens)
- §2.2 Typography → Task 1.4 (next/font wiring)
- §2.3 Animation vocab → Tasks 4.1–4.3 (springs), Task 6.2 (composer expand), Task 5.5 (slide), Task 4.7 (shimmer keyframe in globals.css from Task 1.3)
- §3 Routing changes → Task 3.8 (next.config.ts redirects + /c/[id] route), Task 5.1 (intercepting), Task 5.7 (sub-thread), Task 7.3–7.6 (settings/saved/community-settings/members pages)
- §3 Layout shell + sidebar → Tasks 3.2, 3.3, 3.7
- §3 Modals retained → Tasks 7.1, 7.2 (Confirmation, ImageCrop, CreateCommunity, Search)
- §4.1 Inline composer → Tasks 6.1, 6.2, 6.4, 6.5
- §4.1 Modal composer variant → Task 6.3
- §4.1 RestrictedComposerNotice → Task 6.2 step 1
- §4.2 Intercepting routes + View Transitions → Tasks 5.1, 4.5 (viewTransitionName)
- §4.2 Firefox fallback → handled by browser-native fallback in CSS transition (no explicit code needed)
- §4.3 Reddit threading → Tasks 5.3–5.8
- §5 Tech stack → Task 1.1 (Tailwind), 1.2 (shadcn), 1.5 (motion/sonner/lucide/cmdk), Task 2.1 (primitives), Task 8.2 (removals)
- §6 Phases 1–8 → all 8 phase sections
- §7 Component mapping → applied throughout (specific table reference can be added to commit if useful)
- §8 Testing → Task 5.3 (URL builder), Task 5.4 (comment-tree depth), Task 6.1 (composer state machine), Task 5.8 (buildCommentTree)
- §8.4 Done criteria → covered by Tasks 8.3 (grep verification), 8.4 (final green gate), Task 9 (PR)

No gaps identified.
