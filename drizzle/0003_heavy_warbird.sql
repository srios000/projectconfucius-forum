CREATE TABLE "comment_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"comment_id" text NOT NULL,
	"vote_value" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "vote_status" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_votes_user_comment_idx" ON "comment_votes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "comments_vote_idx" ON "comments" USING btree ("vote_status" DESC NULLS LAST);