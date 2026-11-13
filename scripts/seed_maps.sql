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
