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
            username: { type: "string", input: false, required: false },
            displayUsername: { type: "string", input: false, required: false, fieldName: "display_username" },
        },
    },
});

export type Session = typeof auth.$Infer.Session;