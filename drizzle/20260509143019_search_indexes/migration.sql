CREATE INDEX "division_name_gin_idx" ON "division" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "group_name_gin_idx" ON "group" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "player_battletag_gin_idx" ON "player" USING gin ("battletag" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "player_alias_name_gin_idx" ON "player_alias" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "roster_name_gin_idx" ON "roster" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "season_name_gin_idx" ON "season" USING gin ("name" gin_trgm_ops);