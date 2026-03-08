CREATE TYPE "auth_role" AS ENUM('super_admin', 'admin', 'moderator', 'user');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "auth_role" DEFAULT 'user'::"auth_role" NOT NULL;--> statement-breakpoint
UPDATE "user" SET "role" = 'super_admin'::"auth_role" WHERE "is_super_admin" = true;--> statement-breakpoint
UPDATE "user" SET "role" = 'admin'::"auth_role" WHERE "is_admin" = true AND "is_super_admin" = false;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "is_admin";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "is_super_admin";