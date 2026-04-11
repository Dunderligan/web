ALTER TABLE "member" ADD COLUMN "registered_name" text;--> statement-breakpoint
ALTER TABLE "season" ADD COLUMN "legacy_seeding" boolean DEFAULT false NOT NULL;