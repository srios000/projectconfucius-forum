CREATE TABLE "community_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"community_id" text NOT NULL,
	"invited_user_id" text NOT NULL,
	"invited_by_id" text NOT NULL,
	"role" text DEFAULT 'moderator' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"payload" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "edited_by_id" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "edited_by_role" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "community_members" ADD COLUMN "banned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_members" ADD COLUMN "banned_by_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "edited_by_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "edited_by_role" text;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_invitations_unique_pending" ON "community_invitations" USING btree ("community_id","invited_user_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "community_invitations_invitee_idx" ON "community_invitations" USING btree ("invited_user_id","status");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_edited_by_id_users_id_fk" FOREIGN KEY ("edited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_banned_by_id_users_id_fk" FOREIGN KEY ("banned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_edited_by_id_users_id_fk" FOREIGN KEY ("edited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;