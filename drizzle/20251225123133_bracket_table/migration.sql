CREATE TABLE "bracket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"division_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match" DROP CONSTRAINT "match_division_id_division_id_fkey";--> statement-breakpoint
ALTER TABLE "match" DROP CONSTRAINT "group_xor_division";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "notlegacy_sr_and_tier";--> statement-breakpoint
ALTER TABLE "division" ADD COLUMN "playoff_line" integer;--> statement-breakpoint
ALTER TABLE "division" ADD COLUMN "groupwise_standings" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "bracket_id" uuid;--> statement-breakpoint
ALTER TABLE "bracket" ADD CONSTRAINT "bracket_division_id_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_bracket_id_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "bracket"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "division_id";--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "group_xor_bracket" CHECK ((("group_id" is null or "bracket_id" is null) and ("group_id" is not null or "bracket_id" is not null)));--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "not_both_legacy_sr_and_tier" CHECK (("sr" is null or "tier" is null));