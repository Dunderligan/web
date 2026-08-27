CREATE TABLE "award_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"show_division" boolean DEFAULT true NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "player_award" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"award_type_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"division_id" uuid,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_award_type_id_award_type_id_fkey" FOREIGN KEY ("award_type_id") REFERENCES "award_type"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;