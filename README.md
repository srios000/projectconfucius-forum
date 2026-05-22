# Projectconfucius Forum (PCF)

**A community discussion forum.** Circus handles communities, threaded posts and comments, voting, saved posts, and admin controls. This repository is a fork adapted for Project Confucius — migrating authentication to Better Auth, the database to Postgres with Drizzle, and delegating sign-in to a central auth app at `login.projectconfucius.id`.

---

## Table of Contents

- [Features](#features)
- [Stack](#stack)
- [Architecture Overview](#architecture-overview)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Running via Docker](#running-via-docker)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Features

### Authentication & Accounts

Authentication is handled entirely by the central `login.projectconfucius.id` app. The forum consumes the shared `.projectconfucius.id` session cookie — there is no local sign-up or sign-in UI.

- Sign-in and sign-up redirect to the central login app; sign-out clears the shared session
- A local user row is provisioned automatically on first authenticated request (dual-key relink by auth ID / email)
- Guests can read and browse vote-ranked feeds; all mutations require an authenticated session
- Users can update their username; changes sync to their posts and comments

### Communities

- Create communities with public, restricted, or private visibility
- Subscribe and unsubscribe from communities
- Browse and paginate communities grouped by: moderating, joined, or discover
- Admins can upload, change, or remove the community logo
- Admins can change visibility, add or remove other admins, and remove members
- Admins can delete a community with full cascade cleanup (posts, comments, votes, saved posts, images)

### Posts

- Create posts in a community with an optional image attachment
- Infinite-scroll feeds per community or home — personalized for logged-in users, vote-ranked for guests
- Vote, share, save, and unsave posts; review saved posts in a dedicated modal
- Delete your own posts

### Comments

- Threaded replies to posts and to other comments
- Nested comment rendering within a post view
- Delete your own comments; comment counts stay in sync as threads change

### General

- Global search modal for public communities and recent posts
- Community discovery and recommendations with infinite scroll
- Responsive layout for mobile, tablet, and desktop
- Light/dark mode toggle with preference persisted across sessions
- Toast notifications for key actions

---

## Stack

### Front-End

| Technology | Role |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Typed React code for safer changes and strong editor support |
| [Next.js 16 (App Router)](https://nextjs.org/) | Server components, streaming layouts, and route handlers in `app/` |
| [Jotai](https://github.com/pmndrs/jotai/) | Lightweight global state for posts, votes, communities, saved posts, and modals |
| [Chakra UI 3](https://chakra-ui.com/) | Component library with a custom theme; `next-themes` for light/dark mode |

### Back-End

| Technology | Role |
|---|---|
| [Postgres (Neon)](https://neon.tech/) | Forum database — communities, posts, comments, votes, members, saved posts |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe schema and queries; migrations managed with `drizzle-kit` |
| [Better Auth](https://www.better-auth.com/) | Sibling instance consuming the shared auth Postgres (read-only); no local auth migrations |

---

## Architecture Overview

Circus operates alongside two other services:

```
┌─────────────────────────────────┐      ┌──────────────────────────────────┐
│   login.projectconfucius.id     │      │   Circus (this app)              │
│   Central Auth App              │      │   Forum                          │
│                                 │      │                                  │
│  - Sign-up / sign-in UI         │◄────►│  - No local auth UI              │
│  - Issues shared session cookie │      │  - Reads session via Better Auth │
│  - Owns the auth Postgres DB    │      │  - Provisions local user on      │
│                                 │      │    first authenticated request   │
└─────────────────────────────────┘      └──────────────────────────────────┘
              │                                         │
              │  auth Postgres (read-only via           │  forum Postgres
              │  auth_sibling role)                     │  (Neon, read-write)
              ▼                                         ▼
     ┌─────────────────┐                      ┌─────────────────┐
     │  Auth DB        │                      │  Forum DB       │
     │  (users,        │                      │  (communities,  │
     │   sessions)     │                      │   posts, votes) │
     └─────────────────┘                      └─────────────────┘
```

The forum never writes to the auth database and never runs migrations against it.

---

## Requirements

- Node.js 20.12+
- pnpm 9+
- A Postgres database for the forum (the project uses [Neon](https://neon.tech/))
- Read access to the shared auth Postgres via an `auth_sibling` role (provisioned by the `projectconfucius-auth` owner)
- The central `login.projectconfucius.id` app running and reachable for end-to-end sign-in

---

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/srios000/projectconfucius-forum.git
cd circus-discussions
```

### 2. Install Dependencies

```sh
pnpm install
```

### 3. Configure Environment

Copy the example environment file and fill in your values:

```sh
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for a full reference.

### 4. Set Up the Database

Generate and apply Drizzle migrations against the forum database only. The auth database is never migrated from this app.

```sh
pnpm db:generate   # generate SQL from lib/db/schema.ts
pnpm db:migrate    # apply migrations to the forum Postgres
```

### 5. Run the Dev Server

```sh
pnpm dev
```

The app runs at `http://localhost:3000`. Sign-in flows require the central `login.projectconfucius.id` app to be reachable.

---

## Running via Docker

Ensure your `.env` file is complete and your Postgres database is reachable before building.

```sh
docker-compose -f docker/docker-compose.yml up --build
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string for the forum's own Postgres (Neon) |
| `AUTH_DATABASE_URL` | ✅ | Read-only connection to the shared auth Postgres using the `auth_sibling` role — obtain this from the `projectconfucius-auth` owner |
| `BETTER_AUTH_SECRET` | ✅ | A long, random secret string used to sign sessions. Generate one with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Internal URL of the Better Auth instance (typically `http://localhost:3000` locally) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | ✅ | Public-facing URL of the central login app (`https://login.projectconfucius.id`). This is what the browser redirects to for sign-in |

---

## Troubleshooting

**Sign-in redirects loop or fail**
The central `login.projectconfucius.id` app must be running and accessible. Locally, you may need to run both apps simultaneously. Verify `NEXT_PUBLIC_BETTER_AUTH_URL` points to the correct URL.

**`AUTH_DATABASE_URL` connection refused**
This database is owned by the `projectconfucius-auth` project. Request the `auth_sibling` role credentials from the auth project owner — the forum does not and cannot create this role itself.

**Migrations fail**
`pnpm db:migrate` only runs against `DATABASE_URL` (the forum database). Never point `DATABASE_URL` at the auth database.

**User not provisioned after sign-in**
If a user signs in successfully at the central app but has no local row in the forum database, check that `AUTH_DATABASE_URL` is correct and that the `auth_sibling` role has read access to the `users` and `sessions` tables.