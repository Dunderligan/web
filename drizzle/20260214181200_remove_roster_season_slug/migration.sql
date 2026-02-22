ALTER TABLE "roster" DROP CONSTRAINT "roster_slug_season_slug_unique";--> statement-breakpoint
ALTER TABLE "roster" DROP CONSTRAINT "roster_team_id_season_slug_unique";--> statement-breakpoint
ALTER TABLE "roster" DROP COLUMN "season_slug";