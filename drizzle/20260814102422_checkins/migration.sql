CREATE TABLE "player_checkin" (
	"player_id" uuid,
	"season_id" uuid,
	"discord_id" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_checkin_pkey" PRIMARY KEY("player_id","season_id"),
	CONSTRAINT "player_checkin_discord_id_season_id_unique" UNIQUE("discord_id","season_id")
);
--> statement-breakpoint
ALTER TABLE "season" ADD COLUMN "checkin_open" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "player_checkin" ADD CONSTRAINT "player_checkin_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_checkin" ADD CONSTRAINT "player_checkin_season_id_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE;