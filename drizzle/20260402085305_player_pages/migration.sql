ALTER TYPE "social_platform" ADD VALUE 'discord';--> statement-breakpoint
CREATE TABLE "hero" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "player_alias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"player_id" uuid NOT NULL,
	CONSTRAINT "player_alias_name_player_id_unique" UNIQUE("name","player_id")
);
--> statement-breakpoint
CREATE TABLE "player_social" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"platform" "social_platform" NOT NULL,
	"url" text NOT NULL,
	"player_id" uuid NOT NULL,
	CONSTRAINT "player_social_player_id_platform_unique" UNIQUE("player_id","platform")
);
--> statement-breakpoint
CREATE TABLE "signature_hero" (
	"player_id" uuid,
	"hero_id" uuid,
	CONSTRAINT "signature_hero_pkey" PRIMARY KEY("player_id","hero_id")
);
--> statement-breakpoint
ALTER TABLE "social" RENAME TO "team_social";--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "pronouns" text;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "player_alias" ADD CONSTRAINT "player_alias_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_social" ADD CONSTRAINT "player_social_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "signature_hero" ADD CONSTRAINT "signature_hero_player_id_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "signature_hero" ADD CONSTRAINT "signature_hero_hero_id_hero_id_fkey" FOREIGN KEY ("hero_id") REFERENCES "hero"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "bracket" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "division" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "group" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "registration" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "roster" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "season" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "team_social" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "created_at";
INSERT INTO hero (name) VALUES
    ('anran'),
    ('domina'),
    ('emre'),
    ('jetpack-cat'),
    ('mizuki'),
    ('vendetta'),
    ('ana'),
    ('ashe'),
    ('baptiste'),
    ('bastion'),
    ('brigitte'),
    ('cassidy'),
    ('dva'),
    ('doomfist'),
    ('echo'),
    ('freja'),
    ('genji'),
    ('hanzo'),
    ('hazard'),
    ('illari'),
    ('junker-queen'),
    ('junkrat'),
    ('juno'),
    ('kiriko'),
    ('lifeweaver'),
    ('lucio'),
    ('mauga'),
    ('mei'),
    ('mercy'),
    ('moira'),
    ('orisa'),
    ('pharah'),
    ('ramattra'),
    ('reaper'),
    ('reinhardt'),
    ('roadhog'),
    ('sigma'),
    ('sojourn'),
    ('soldier-76'),
    ('sombra'),
    ('symmetra'),
    ('torbjorn'),
    ('tracer'),
    ('venture'),
    ('widowmaker'),
    ('winston'),
    ('wrecking-ball'),
    ('wuyang'),
    ('zarya'),
    ('zenyatta');
