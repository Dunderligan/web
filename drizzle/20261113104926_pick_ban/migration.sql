CREATE TYPE "decision_point" AS ENUM('map_pick', 'ban_order', 'first_ban', 'second_ban');--> statement-breakpoint
CREATE TYPE "map_outcome" AS ENUM('a', 'b', 'draw');--> statement-breakpoint
CREATE TYPE "pick_ban_map_type" AS ENUM('fixed', 'pool');--> statement-breakpoint
CREATE TYPE "room_close_reason" AS ENUM('finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "room_map_report_state" AS ENUM('pending', 'agreed', 'disputed', 'resolved');--> statement-breakpoint
CREATE TYPE "room_status" AS ENUM('open', 'ready_check', 'in_progress', 'finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "win_condition" AS ENUM('first_to', 'fixed_maps');--> statement-breakpoint
CREATE TABLE "gamemode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"gamemode_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_ban_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"division_id" uuid,
	"bracket_id" uuid,
	"round" integer,
	"enabled" boolean,
	"decision_timeout_seconds" integer,
	"allow_concede_first_ban" boolean,
	"win_condition" "win_condition",
	"map_count" integer,
	"map_type" "pick_ban_map_type",
	"set_allowed_map_ids" boolean DEFAULT false NOT NULL,
	"allowed_map_ids" uuid[],
	"set_allowed_gamemode_ids" boolean DEFAULT false NOT NULL,
	"allowed_gamemode_ids" uuid[],
	"set_first_gamemode_id" boolean DEFAULT false NOT NULL,
	"first_gamemode_id" uuid,
	"restrict_used_gamemodes" boolean,
	"fixed_map_ids" uuid[],
	CONSTRAINT "pick_ban_config_scope_key" UNIQUE NULLS NOT DISTINCT("division_id","bracket_id","round"),
	CONSTRAINT "pick_ban_config_map_count" CHECK ("map_count" is null or "map_count" >= 1),
	CONSTRAINT "pick_ban_config_timeout" CHECK ("decision_timeout_seconds" is null or "decision_timeout_seconds" >= 1),
	CONSTRAINT "pick_ban_config_round" CHECK ("round" is null or "round" >= 0)
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"match_id" uuid NOT NULL,
	"status" "room_status" DEFAULT 'open'::"room_status" NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"config_snapshot" jsonb NOT NULL,
	"team_a_seed" integer NOT NULL,
	"team_b_seed" integer NOT NULL,
	"current_map_index" integer DEFAULT 0 NOT NULL,
	"next_deadline_at" timestamp with time zone,
	"close_reason" "room_close_reason",
	"closed_at" timestamp with time zone,
	"created_by_id" uuid,
	"cancelled_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_seeds" CHECK ("team_a_seed" >= 0 and "team_b_seed" >= 0),
	CONSTRAINT "room_current_map_index" CHECK ("current_map_index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "room_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_map_id" uuid NOT NULL,
	"point" "decision_point" NOT NULL,
	"slot" "match_slot" NOT NULL,
	"value" jsonb NOT NULL,
	"automatic" boolean DEFAULT false NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_decision_point_key" UNIQUE("room_map_id","point")
);
--> statement-breakpoint
CREATE TABLE "room_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"map_id" uuid,
	"first_ban_slot" "match_slot" NOT NULL,
	"report_state" "room_map_report_state" DEFAULT 'pending'::"room_map_report_state" NOT NULL,
	"outcome" "map_outcome",
	"decisions_completed_at" timestamp with time zone,
	"result_recorded_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_map_room_index_key" UNIQUE("room_id","index"),
	CONSTRAINT "room_map_index" CHECK ("index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "room_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_map_id" uuid NOT NULL,
	"slot" "match_slot" NOT NULL,
	"outcome" "map_outcome" NOT NULL,
	"submitted_by_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_report_map_slot_key" UNIQUE("room_map_id","slot")
);
--> statement-breakpoint
CREATE INDEX "map_gamemode_id_idx" ON "map" ("gamemode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_one_active_per_match_idx" ON "room" ("match_id") WHERE "status" in ('open', 'ready_check', 'in_progress');--> statement-breakpoint
CREATE INDEX "room_next_deadline_at_idx" ON "room" ("next_deadline_at");--> statement-breakpoint
CREATE INDEX "room_state_idx" ON "room" ("status");--> statement-breakpoint
CREATE INDEX "room_decision_room_map_id_idx" ON "room_decision" ("room_map_id");--> statement-breakpoint
CREATE INDEX "room_map_room_id_idx" ON "room_map" ("room_id");--> statement-breakpoint
CREATE INDEX "room_map_map_id_idx" ON "room_map" ("map_id");--> statement-breakpoint
CREATE INDEX "room_report_room_map_id_idx" ON "room_report" ("room_map_id");--> statement-breakpoint
ALTER TABLE "map" ADD CONSTRAINT "map_gamemode_id_gamemode_id_fkey" FOREIGN KEY ("gamemode_id") REFERENCES "gamemode"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pick_ban_config" ADD CONSTRAINT "pick_ban_config_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pick_ban_config" ADD CONSTRAINT "pick_ban_config_bracket_id_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "bracket"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pick_ban_config" ADD CONSTRAINT "pick_ban_config_first_gamemode_id_gamemode_id_fkey" FOREIGN KEY ("first_gamemode_id") REFERENCES "gamemode"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_match_id_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_cancelled_by_id_user_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room_decision" ADD CONSTRAINT "room_decision_room_map_id_room_map_id_fkey" FOREIGN KEY ("room_map_id") REFERENCES "room_map"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "room_decision" ADD CONSTRAINT "room_decision_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room_map" ADD CONSTRAINT "room_map_room_id_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "room_map" ADD CONSTRAINT "room_map_map_id_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "map"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "room_map" ADD CONSTRAINT "room_map_resolved_by_id_user_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room_report" ADD CONSTRAINT "room_report_room_map_id_room_map_id_fkey" FOREIGN KEY ("room_map_id") REFERENCES "room_map"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "room_report" ADD CONSTRAINT "room_report_submitted_by_id_user_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "user"("id") ON DELETE SET NULL;

INSERT INTO "gamemode" ("name", "slug", "active") VALUES
	('Control', 'control', true),
	('Escort', 'escort', true),
	('Flashpoint', 'flashpoint', true),
	('Hybrid', 'hybrid', true),
	('Push', 'push', true),
	('Clash', 'clash', false)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "map" ("name", "slug", "gamemode_id", "active")
SELECT
	v."name",
	v."slug",
	g."id",
	v."active"
FROM (
	VALUES
		('Antarctic Peninsula', 'antarctic-peninsula', 'control', true),
		('Busan', 'busan', 'control', true),
		('Ilios', 'ilios', 'control', true),
		('Lijiang Tower', 'lijiang-tower', 'control', true),
		('Nepal', 'nepal', 'control', true),
		('Oasis', 'oasis', 'control', true),
		('Samoa', 'samoa', 'control', true),
		('Circuit Royal', 'circuit-royal', 'escort', true),
		('Dorado', 'dorado', 'escort', true),
		('Havana', 'havana', 'escort', true),
		('Junkertown', 'junkertown', 'escort', true),
		('Rialto', 'rialto', 'escort', true),
		('Route 66', 'route-66', 'escort', true),
		('Shambali Monastery', 'shambali-monastery', 'escort', true),
		('Watchpoint: Gibraltar', 'watchpoint-gibraltar', 'escort', true),
		('Watchpoint: Grímsvötn', 'watchpoint-grimsvotn', 'escort', true),
		('Aatlis', 'aatlis', 'flashpoint', true),
		('New Junk City', 'new-junk-city', 'flashpoint', true),
		('Suravasa', 'suravasa', 'flashpoint', true),
		('Blizzard World', 'blizzard-world', 'hybrid', true),
		('Eichenwalde', 'eichenwalde', 'hybrid', true),
		('Hollywood', 'hollywood', 'hybrid', true),
		('King''s Row', 'kings-row', 'hybrid', true),
		('Midtown', 'midtown', 'hybrid', true),
		('Neon Junction', 'neon-junction', 'hybrid', true),
		('Numbani', 'numbani', 'hybrid', true),
		('Paraíso', 'paraiso', 'hybrid', true),
		('Colosseo', 'colosseo', 'push', true),
		('Esperança', 'esperanca', 'push', true),
		('New Queen Street', 'new-queen-street', 'push', true),
		('Runasapi', 'runasapi', 'push', true),
		('Hanaoka', 'hanaoka', 'clash', false),
		('Throne of Anubis', 'throne-of-anubis', 'clash', false)
) AS v("name", "slug", "gamemode_slug", "active")
JOIN "gamemode" g ON g."slug" = v."gamemode_slug"
ON CONFLICT ("slug") DO NOTHING;

