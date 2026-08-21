ALTER TABLE "hero" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "role";--> statement-breakpoint
CREATE TYPE "role" AS ENUM('tank', 'damage', 'support', 'flex', 'coach', 'manager');--> statement-breakpoint
ALTER TABLE "hero" ALTER COLUMN "role" SET DATA TYPE "role" USING "role"::"role";--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "role" SET DATA TYPE "role" USING "role"::"role";