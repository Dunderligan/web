CREATE TYPE "match_type" AS ENUM('group', 'bracket');--> statement-breakpoint
CREATE TYPE "rank" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'champion');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('damage', 'tank', 'support', 'flex', 'coach');--> statement-breakpoint
CREATE TYPE "social_platform" AS ENUM('youtube', 'twitter');--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"battletag" text NOT NULL UNIQUE,
	"battlenet_id" integer NOT NULL UNIQUE,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "division" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"season_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "division_slug_season_id_unique" UNIQUE("slug","season_id")
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"division_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_slug_division_id_unique" UNIQUE("slug","division_id")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid,
	"division_id" uuid,
	"roster_a_id" uuid,
	"roster_b_id" uuid,
	"team_a_score" integer,
	"team_b_score" integer,
	"draws" integer,
	"played" boolean DEFAULT false NOT NULL,
	"played_at" timestamp,
	"scheduled_at" timestamp,
	"vod_url" text,
	"next_match_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_xor_division" CHECK ((("group_id" is null or "division_id" is null) and ("group_id" is not null or "division_id" is not null)))
);
--> statement-breakpoint
CREATE TABLE "member" (
	"player_id" uuid,
	"roster_id" uuid,
	"rank" "rank",
	"tier" integer,
	"sr" integer,
	"role" "role" NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_pkey" PRIMARY KEY("player_id","roster_id"),
	CONSTRAINT "tier_range" CHECK ("tier" >= 1 AND "tier" <= 5),
	CONSTRAINT "notlegacy_sr_and_tier" CHECK (not ("sr" is not null and "tier" is not null))
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"battletag" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"season_slug" text NOT NULL,
	"team_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roster_slug_season_slug_unique" UNIQUE("slug","season_slug"),
	CONSTRAINT "roster_team_id_season_slug_unique" UNIQUE("team_id","season_slug")
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"legacy_ranks" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"platform" "social_platform" NOT NULL,
	"url" text NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_team_id_platform_unique" UNIQUE("team_id","platform")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "division" ADD CONSTRAINT "division_season_id_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_group_id_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_roster_a_id_roster_id_fkey" FOREIGN KEY ("roster_a_id") REFERENCES "roster"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_roster_b_id_roster_id_fkey" FOREIGN KEY ("roster_b_id") REFERENCES "roster"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_next_match_id_match_id_fkey" FOREIGN KEY ("next_match_id") REFERENCES "match"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_roster_id_roster_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "roster"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_group_id_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "social" ADD CONSTRAINT "social_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;