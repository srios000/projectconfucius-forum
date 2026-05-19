import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified"),
    image: text("image"),
    roles: text("roles"),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    password: text("password"),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});