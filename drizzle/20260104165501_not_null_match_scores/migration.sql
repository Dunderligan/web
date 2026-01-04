UPDATE "match"
SET
    "team_a_score" = COALESCE("team_a_score", 0),
    "team_b_score" = COALESCE("team_b_score", 0),
    "draws" = COALESCE("draws", 0);

ALTER TABLE "match"
ALTER COLUMN "team_a_score"
SET DEFAULT 0;

--> statement-breakpoint
ALTER TABLE "match"
ALTER COLUMN "team_a_score"
SET
    NOT NULL;

--> statement-breakpoint
ALTER TABLE "match"
ALTER COLUMN "team_b_score"
SET DEFAULT 0;

--> statement-breakpoint
ALTER TABLE "match"
ALTER COLUMN "team_b_score"
SET
    NOT NULL;

--> statement-breakpoint
ALTER TABLE "match"
ALTER COLUMN "draws"
SET DEFAULT 0;

--> statement-breakpoint
ALTER TABLE "match"
ALTER COLUMN "draws"
SET
    NOT NULL;