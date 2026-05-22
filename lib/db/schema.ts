import { sql } from "drizzle-orm";
import { pgTable, text, integer, smallint, boolean, timestamp, pgEnum, uniqueIndex, index, primaryKey, check } from "drizzle-orm/pg-core";

export const privacyEnum = pgEnum("privacy_type", ["public", "restricted", "private"]);

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    username: text("username").unique(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communities = pgTable("communities", {
    id: text("id").primaryKey(),
    creatorId: text("creator_id").notNull().references(() => users.id),
    privacyType: privacyEnum("privacy_type").notNull().default("public"),
    imageUrl: text("image_url"),
    numberOfMembers: integer("number_of_members").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityMembers = pgTable("community_members", {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
    isModerator: boolean("is_moderator").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.communityId] })]);

export const posts = pgTable("posts", {
    id: text("id").primaryKey(),
    communityId: text("community_id").references(() => communities.id, { onDelete: "cascade" }),
    wallUserId: text("wall_user_id").references(() => users.id, { onDelete: "cascade" }),
    creatorId: text("creator_id").notNull().references(() => users.id),
    creatorUsername: text("creator_username"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    communityImageUrl: text("community_image_url"),
    numberOfComments: integer("number_of_comments").notNull().default(0),
    voteStatus: integer("vote_status").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    index("posts_community_created_idx").on(t.communityId, t.createdAt.desc()),
    index("posts_wall_created_idx").on(t.wallUserId, t.createdAt.desc()),
    index("posts_vote_idx").on(t.voteStatus.desc()),
    check(
        "posts_target_exclusive",
        sql`(${t.communityId} IS NULL) <> (${t.wallUserId} IS NULL)`,
    ),
]);

export const comments = pgTable("comments", {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    communityId: text("community_id"),
    postTitle: text("post_title").notNull(),
    creatorId: text("creator_id").notNull().references(() => users.id),
    creatorDisplayText: text("creator_display_text"),
    text: text("text").notNull(),
    depth: integer("depth").notNull().default(0),
    voteStatus: integer("vote_status").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    index("comments_post_created_idx").on(t.postId, t.createdAt.desc()),
    index("comments_vote_idx").on(t.voteStatus.desc()),
]);

export const postVotes = pgTable("post_votes", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    communityId: text("community_id"),
    voteValue: smallint("vote_value").notNull(),
}, (t) => [uniqueIndex("post_votes_user_post_idx").on(t.userId, t.postId)]);

export const commentVotes = pgTable("comment_votes", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
    voteValue: smallint("vote_value").notNull(),
}, (t) => [uniqueIndex("comment_votes_user_comment_idx").on(t.userId, t.commentId)]);

export const savedPosts = pgTable("saved_posts", {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    communityId: text("community_id"),
    postTitle: text("post_title").notNull(),
    communityImageUrl: text("community_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);