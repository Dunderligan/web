CREATE TABLE "registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"season_id" uuid UNIQUE,
	"url" text NOT NULL,
	"open_date" timestamp NOT NULL,
	"close_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_season_id_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE;