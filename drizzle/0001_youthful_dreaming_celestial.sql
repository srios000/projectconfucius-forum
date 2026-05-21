ALTER TABLE "comments" ALTER COLUMN "creator_display_text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "creator_username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");