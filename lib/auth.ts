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
    session: {
        // Match the hub's 14-day idle window. Better Auth's default is 7 days,
        // so without this the forum SHORTENS the shared session every time it
        // refreshes it (visible as expiresAt = updatedAt + 7d in the DB).
        expiresIn: 60 * 60 * 24 * 14, // 14 days
        // Surface the admin plugin's impersonation marker. The forum has no
        // admin plugin, so `impersonatedBy` is not a known session field and
        // filterOutputFields() would STRIP it from getSession()/useSession()
        // output even though the column is selected. Declaring it here keeps it.
        // Read-only mirror: the column is written by the hub, never here.
        additionalFields: {
            impersonatedBy: { type: "string", input: false, required: false },
        },
    },
    advanced: {
        // CRITICAL for the sibling architecture. Without a cookie domain, every
        // session cookie the forum writes (on refresh/sign-out) is HOST-ONLY on
        // forum.projectconfucius.id and SHADOWS the hub's shared
        // `.projectconfucius.id` cookie. The browser then sends the stale
        // host-only cookie first, so after a hub impersonation the forum keeps
        // reading the admin's own pre-impersonation session. Must match the hub.
        crossSubDomainCookies: {
            enabled: !!process.env.BETTER_AUTH_COOKIE_DOMAIN,
            domain: process.env.BETTER_AUTH_COOKIE_DOMAIN, // ".projectconfucius.id"
        },
        defaultCookieAttributes: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
        },
    },
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
            username: { type: "string", input: false, required: false },
            displayUsername: { type: "string", input: false, required: false, fieldName: "display_username" },
        },
    },
});

export type Session = typeof auth.$Infer.Session;