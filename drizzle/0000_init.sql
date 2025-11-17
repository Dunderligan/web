CREATE TYPE "public"."match_type" AS ENUM('group', 'bracket');--> statement-breakpoint
CREATE TYPE "public"."rank" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'champion');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('damage', 'tank', 'support', 'flex', 'coach');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('youtube', 'twitter');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "division" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"season_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "division_slug_seasonId_unique" UNIQUE("slug","season_id")
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"division_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_slug_divisionId_unique" UNIQUE("slug","division_id")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"player_id" uuid NOT NULL,
	"roster_id" uuid NOT NULL,
	"rank" "rank" NOT NULL,
	"tier" integer NOT NULL,
	"role" "role" NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_player_id_roster_id_pk" PRIMARY KEY("player_id","roster_id"),
	CONSTRAINT "tier" CHECK ("member"."tier" >= 1 AND "member"."tier" <= 5)
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battletag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_battletag_unique" UNIQUE("battletag")
);
--> statement-breakpoint
CREATE TABLE "roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"season_slug" text NOT NULL,
	"team_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roster_slug_seasonSlug_unique" UNIQUE("slug","season_slug")
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "season_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "social" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "social_platform" NOT NULL,
	"url" text NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_teamId_platform_unique" UNIQUE("team_id","platform")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division" ADD CONSTRAINT "division_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_division_id_division_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."division"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_division_id_division_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."division"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_roster_a_id_roster_id_fk" FOREIGN KEY ("roster_a_id") REFERENCES "public"."roster"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_roster_b_id_roster_id_fk" FOREIGN KEY ("roster_b_id") REFERENCES "public"."roster"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_next_match_id_match_id_fk" FOREIGN KEY ("next_match_id") REFERENCES "public"."match"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_roster_id_roster_id_fk" FOREIGN KEY ("roster_id") REFERENCES "public"."roster"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social" ADD CONSTRAINT "social_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;