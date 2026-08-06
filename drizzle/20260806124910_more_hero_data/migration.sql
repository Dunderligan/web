ALTER TABLE "hero"
DROP CONSTRAINT "hero_name_key";

ALTER TABLE "hero"
RENAME COLUMN "name" TO "slug";

ALTER TABLE "hero"
ADD COLUMN "name" text;

UPDATE "hero"
SET
  "name" = initcap(replace("slug", '-', ' '));

ALTER TABLE "hero"
ALTER COLUMN "name"
SET NOT NULL;

ALTER TABLE "hero"
ADD COLUMN "role" "role";

UPDATE "hero"
SET
  "role" = 'tank'
WHERE
  "slug" IN (
    'domina',
    'dva',
    'doomfist',
    'hazard',
    'junker-queen',
    'mauga',
    'orisa',
    'ramattra',
    'reinhardt',
    'roadhog',
    'sigma',
    'winston',
    'wrecking-ball',
    'zarya'
  );

UPDATE "hero"
SET
  "role" = 'damage'
WHERE
  "slug" IN (
    'anran',
    'emre',
    'vendetta',
    'ashe',
    'bastion',
    'cassidy',
    'echo',
    'freja',
    'genji',
    'hanzo',
    'junkrat',
    'mei',
    'pharah',
    'reaper',
    'sojourn',
    'soldier-76',
    'sombra',
    'symmetra',
    'torbjorn',
    'tracer',
    'venture',
    'widowmaker',
    'shion',
    'sierra'
  );

UPDATE "hero"
SET
  "role" = 'support'
WHERE
  "slug" IN (
    'jetpack-cat',
    'mizuki',
    'ana',
    'baptiste',
    'brigitte',
    'illari',
    'juno',
    'kiriko',
    'lifeweaver',
    'lucio',
    'mercy',
    'moira',
    'wuyang',
    'zenyatta'
  );

ALTER TABLE "hero"
ALTER COLUMN "role"
SET NOT NULL;

ALTER TABLE "hero"
ADD CONSTRAINT "hero_slug_key" UNIQUE ("slug");
