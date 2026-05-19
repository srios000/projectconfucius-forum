# **Circus Discussions**
*Forum Discussions Web Application*

<img width="1000" alt="cover" src="https://github.com/mbeps/next_discussion_platform/assets/58662575/21829226-db49-4f91-815c-8af72ff6dacf">

---

Introducing Circus, a discussion platform built on Next.js, Postgres, and Drizzle. It covers communities, voting, saved posts, and admin controls.
Users join and manage communities, post with images, vote, share, and save posts for later. Threaded comments and search keep discussions connected.
Authentication is delegated to the central `login.projectconfucius.id` app via a sibling Better Auth instance — there is no sign-up or sign-in inside the forum. Profile edits sync to posts and comments. The UI is responsive with light/dark mode and global toasts.

# **Requirements**
These are the requirements needed to run the project:
- Node.js 20.12+
- pnpm 9+
- A Postgres database for the forum's own data (the project uses [Neon](https://neon.tech/))
- Read access to the shared auth Postgres database — an `auth_sibling` role provided by the `projectconfucius-auth` owner
- A running / deployed `login.projectconfucius.id` central auth app for end-to-end sign-in

# **Features**
## **Authentication & Account Management**
Authentication is handled by the central `login.projectconfucius.id` app; the forum is a sibling consumer of that session (a shared `.projectconfucius.id` cookie):
- Sign-up and sign-in happen on the central login app — the forum has no local auth UI
- "Log In" / "Sign Up" redirect to the central app; sign-out clears the shared session
- A local user row is provisioned automatically on first authenticated request (dual-key relink by auth id / email)
- Read and vote-ranked feeds are available to guests; mutations require an authenticated session
- Users can update their username, with changes synced to their posts and comments (profile image upload is deferred to a later phase)

## **Community**
The system has several key community management features designed to promote engagement and collaboration among users:
- Users can create communities with public, restricted, or private types
- Users can subscribe and unsubscribe to and from a community
- Admins can upload, change, or delete the community logo
- Admins can change community visibility
- Admins can add or remove other admins
- Admins can remove members from a community
- Users can view and paginate public and restricted communities, grouped by moderating, joined, or discover
- Admins can delete a community with cascade cleanup of posts, comments, votes, snippets, and images

## **Posts**
The system has several key features designed to make it easy for users to create and view posts within communities:
- Users can create a post in a specific community with an optional image
- Users can browse infinite feeds per community or home, with personalized subscribed feeds and a vote-ranked feed for guests
- Users can open a post to interact with threaded comments
- Users can view posts from subscribed communities and discover posts from all communities
- Users can delete a post they have created
- Users can vote on a post
- Users can share a post
- Users can save and unsave posts, and review them in a saved posts modal

## **Comments**
The web application has several key features designed to make it easy for users to engage with others by creating and viewing comments:
- Users can create threaded replies to posts and comments
- Users can view nested comments in a post
- Users can delete a comment they created
- Comment counts stay in sync when threads change

## **General**
The system has several general features to make the site user-friendly and accessible:
- Logged-in users can view an infinite home feed from communities they are subscribed to
- Logged-out users can view a vote-ranked home feed from all communities
- Global search modal for public communities and recent posts
- Community discovery and recommendations with infinite scroll
- System UI is responsive, hence it can be used on smartphones, tablets, or computers
- Global light/dark-mode toggle with preference persistence across sessions
- Toast notifications for key actions

# **Stack**
These are the main technologies that were used in this project:

## **Front-End**
- [**TypeScript**](https://www.typescriptlang.org/): Typed React code for safer changes and strong editor support.
- [**Next.js (App Router)**](https://nextjs.org/): Runs on Next.js 16 with the App Router on React 18, using server components, streaming layouts, and route handlers in `app/`.
- [**Jotai State Manager**](https://github.com/pmndrs/jotai/): Lightweight global state for posts, votes, communities, saved posts, and modals.
- [**Chakra UI**](https://chakra-ui.com/): Chakra UI 3 with a custom theme, Emotion styling, and `next-themes` for persistent light/dark mode.


## **Back-End**
- [**Postgres**](https://www.postgresql.org/): The forum's own database (hosted on [Neon](https://neon.tech/)) stores communities, posts, comments, votes, members, and saved posts. Counters and threaded deletes are kept consistent with transactions and a recursive CTE.
- [**Drizzle ORM**](https://orm.drizzle.team/): Type-safe schema and queries; migrations managed with `drizzle-kit` (`pnpm db:generate` / `pnpm db:migrate`).
- [**Better Auth**](https://www.better-auth.com/): A sibling instance of the central `login.projectconfucius.id` auth app. It reads the shared auth Postgres (read-only `auth_sibling` role) and never migrates it; the forum has no local sign-up/sign-in.

# **Running Application Locally**
These are simple steps to run the application locally. For more detail instructions, refer to the [Wiki](https://github.com/mbeps/next_discussion_platform/wiki). 

## 1. **Clone the Project Locally**
```sh
git clone https://github.com/mbeps/next_discussion_platform.git
```

## 2. **Install Dependencies**
```sh
pnpm install
```

## 3. **Set Up Environment**
1. Copy `.env.example` to `.env`
2. Populate it with:
   - `DATABASE_URL` — the forum's own Postgres (Neon) connection string
   - `AUTH_DATABASE_URL` — read-only `auth_sibling` connection to the shared auth Postgres (from the `projectconfucius-auth` owner)
   - `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL` — sibling Better Auth config (the public URL points at the central login app)

## 4. **Set Up the Database**
Generate and apply the Drizzle migrations against your `DATABASE_URL` (the forum never migrates the shared auth database):
```sh
pnpm db:generate   # generate SQL migrations from lib/db/schema.ts
pnpm db:migrate    # apply them to the forum Postgres
```

## 5. **Run Project**
```sh
pnpm dev
```
This should run the project on `localhost:3000`. Sign-in flows require the central `login.projectconfucius.id` app to be reachable.

# **Running via Docker**
You can build and run the application through Docker. This requires a completed `.env` file (see *Set Up Environment* above) and a reachable Postgres database.

Once everything is ready, use the command below to run the application.
```sh
docker-compose -f docker/docker-compose.yml up --build
```

# **Demo**
This video demonstrates the features and functionality of the project. 

https://user-images.githubusercontent.com/58662575/236821702-25dfb59c-162f-4de5-af8f-e0e7b8315aae.mp4
