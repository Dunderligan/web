CREATE TYPE "submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "award_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"show_division" boolean DEFAULT true NOT NULL,
	"image_url" text
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_award" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"award_type_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"division_id" uuid,
	"description" text
);--> statement-breakpoint
ALTER TABLE "award_type" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_award_award_type_id_award_type_id_fkey') THEN
		ALTER TABLE "player_award" ADD CONSTRAINT "player_award_award_type_id_award_type_id_fkey" FOREIGN KEY ("award_type_id") REFERENCES "award_type"("id") ON DELETE CASCADE;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_award_player_id_player_id_fkey') THEN
		ALTER TABLE "player_award" ADD CONSTRAINT "player_award_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_award_division_id_division_id_fkey') THEN
		ALTER TABLE "player_award" ADD CONSTRAINT "player_award_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;
	END IF;
END $$;--> statement-breakpoint
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