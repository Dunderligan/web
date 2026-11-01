CREATE TYPE "bracket_format" AS ENUM('single_elimination', 'double_elimination');--> statement-breakpoint
CREATE TYPE "bracket_side" AS ENUM('upper', 'lower', 'grand_final');--> statement-breakpoint
CREATE TYPE "match_slot" AS ENUM('a', 'b');--> statement-breakpoint
ALTER TABLE "bracket" ADD COLUMN "format" "bracket_format" DEFAULT 'single_elimination'::"bracket_format" NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "next_slot" "match_slot";--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "loser_next_match_id" uuid;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "loser_slot" "match_slot";--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "bracket_side" "bracket_side";--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_loser_next_match_id_match_id_fkey" FOREIGN KEY ("loser_next_match_id") REFERENCES "match"("id") ON DELETE SET NULL;--> statement-breakpoint
UPDATE "match" SET "bracket_side" = 'upper' WHERE "bracket_id" IS NOT NULL;--> statement-breakpoint
WITH "feeders" AS (
	SELECT "id", "next_match_id", row_number() OVER (PARTITION BY "next_match_id" ORDER BY "order") AS "rn"
	FROM "match"
	WHERE "next_match_id" IS NOT NULL
)
UPDATE "match" SET "next_slot" = CASE WHEN "feeders"."rn" = 1 THEN 'a'::"match_slot" ELSE 'b'::"match_slot" END
FROM "feeders" WHERE "match"."id" = "feeders"."id";--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "bracket_side_for_bracket_matches" CHECK (("bracket_id" is null) = ("bracket_side" is null));