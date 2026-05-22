ALTER TABLE "comments" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_votes" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_posts" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "wall_user_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_wall_user_id_users_id_fk" FOREIGN KEY ("wall_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_wall_created_idx" ON "posts" USING btree ("wall_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_target_exclusive" CHECK (("posts"."community_id" IS NULL) <> ("posts"."wall_user_id" IS NULL));