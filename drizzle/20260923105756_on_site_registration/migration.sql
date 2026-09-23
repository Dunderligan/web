CREATE TYPE "submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "award_type" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
CREATE TABLE "team_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"registration_id" uuid NOT NULL,
	"submitted_by_id" uuid,
	"approved_roster_id" uuid,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_id" uuid,
	"status" "submission_status" DEFAULT 'pending'::"submission_status" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration" ADD COLUMN "max_players" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "registration" ADD COLUMN "min_players" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "team_submission" ADD CONSTRAINT "team_submission_registration_id_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registration"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_submission" ADD CONSTRAINT "team_submission_submitted_by_id_user_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "team_submission" ADD CONSTRAINT "team_submission_approved_roster_id_roster_id_fkey" FOREIGN KEY ("approved_roster_id") REFERENCES "roster"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "team_submission" ADD CONSTRAINT "team_submission_reviewed_by_id_user_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "match" DROP CONSTRAINT "group_xor_bracket", ADD CONSTRAINT "group_xor_bracket" CHECK (((not "group_id" is not null or not "bracket_id" is not null) and ("group_id" is not null or "bracket_id" is not null)));