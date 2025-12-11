# Database Documentation

## Overview

Dunderligan uses PostgreSQL as its primary database and Drizzle ORM as the database toolkit. The schema is designed to handle complex tournament structures with seasons, divisions, groups, teams, players, and matches.

## Database Schema

### Entity Relationship Diagram

```
Season (1) ──→ (N) Division (1) ──→ (N) Group (1) ──→ (N) Roster
                      │                                      │
                      │                                      ├──→ (N) Member (N) ──→ (1) Player
                      │                                      │
                      └──────→ (N) Match                     └──→ (1) Team (1) ──→ (N) Social
                                  │
Group ──→ (N) Match               └──→ Match (next)
```

## Core Tables

### `season`

Represents a tournament season.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Display name (e.g., "Dunderligan 2024")
- `slug` (TEXT, UNIQUE): URL-friendly identifier
- `startedAt` (TIMESTAMP): Season start date
- `endedAt` (TIMESTAMP, nullable): Season end date (null if ongoing)
- `legacyRanks` (BOOLEAN): Whether to use old rank system (SR vs Tier)
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `slug`

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Dunderligan 2024",
  "slug": "2024",
  "startedAt": "2024-03-01T00:00:00Z",
  "endedAt": null,
  "legacyRanks": false
}
```

### `division`

Represents a skill-based division within a season (e.g., Diamond, Platinum).

**Columns:**
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Display name (e.g., "Diamond")
- `slug` (TEXT): URL-friendly identifier
- `playoffLine` (INTEGER, nullable): Position where playoff qualification starts
- `seasonId` (UUID, FK → season.id): Parent season
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Constraints:**
- Foreign key to `season` with CASCADE delete
- Unique constraint on (`slug`, `seasonId`)

**Example:**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "name": "Diamond",
  "slug": "diamond",
  "playoffLine": 4,
  "seasonId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### `group`

Represents a group within a division for group-stage matches.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Display name (e.g., "Group A")
- `slug` (TEXT): URL-friendly identifier
- `divisionId` (UUID, FK → division.id): Parent division
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Constraints:**
- Foreign key to `division` with CASCADE delete
- Unique constraint on (`slug`, `divisionId`)

### `team`

Represents a persistent team entity across seasons.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Note:** Teams are minimal entities. Most team data is stored in season-specific rosters.

### `roster`

Represents a team's roster for a specific season.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Team name for this season
- `slug` (TEXT): URL-friendly identifier
- `seasonSlug` (TEXT): Season slug for URL construction
- `teamId` (UUID, FK → team.id): Parent team
- `groupId` (UUID, FK → group.id): Assigned group
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Constraints:**
- Foreign key to `team` with CASCADE delete
- Foreign key to `group` with CASCADE delete
- Unique constraint on (`slug`, `seasonSlug`)
- Unique constraint on (`teamId`, `seasonSlug`)

**Example:**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002",
  "name": "Team Awesome",
  "slug": "team-awesome",
  "seasonSlug": "2024",
  "teamId": "850e8400-e29b-41d4-a716-446655440003",
  "groupId": "950e8400-e29b-41d4-a716-446655440004"
}
```

### `social`

Social media links for teams.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `platform` (ENUM): Social media platform
- `url` (TEXT): Profile URL
- `teamId` (UUID, FK → team.id): Associated team
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Enums:**
- `platform`: One of the values defined in `SocialPlatform` enum

**Constraints:**
- Foreign key to `team` with CASCADE delete
- Unique constraint on (`teamId`, `platform`)

### `player`

Represents individual players.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `battletag` (TEXT, UNIQUE): Overwatch/Battle.net username
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `battletag`

### `member`

Junction table linking players to rosters with role and rank information.

**Columns:**
- `playerId` (UUID, FK → player.id): Associated player
- `rosterId` (UUID, FK → roster.id): Associated roster
- `rank` (ENUM, nullable): Player's rank (new system)
- `tier` (INTEGER, nullable): Rank tier 1-5 (new system)
- `sr` (INTEGER, nullable): Skill rating (legacy system)
- `role` (ENUM): Player's role (Tank, DPS, Support)
- `isCaptain` (BOOLEAN): Whether player is team captain
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Constraints:**
- Composite primary key on (`playerId`, `rosterId`)
- Foreign key to `player` with CASCADE delete
- Foreign key to `roster` with CASCADE delete
- Check constraint: `tier` must be between 1 and 5
- Check constraint: Cannot have both `sr` and `tier` set (XOR logic)

**Enums:**
- `rank`: Rank values from `Rank` enum (Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, Champion)
- `role`: Role values from `Role` enum (Tank, DPS, Support)

**Example:**
```json
{
  "playerId": "a50e8400-e29b-41d4-a716-446655440005",
  "rosterId": "750e8400-e29b-41d4-a716-446655440002",
  "rank": "diamond",
  "tier": 3,
  "sr": null,
  "role": "dps",
  "isCaptain": true
}
```

### `match`

Represents matches between two rosters.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `groupId` (UUID, FK → group.id, nullable): Group for group-stage matches
- `divisionId` (UUID, FK → division.id, nullable): Division for playoff matches
- `rosterAId` (UUID, FK → roster.id, nullable): First team
- `rosterBId` (UUID, FK → roster.id, nullable): Second team
- `teamAScore` (INTEGER, nullable): First team's score
- `teamBScore` (INTEGER, nullable): Second team's score
- `draws` (INTEGER, nullable): Number of drawn maps
- `played` (BOOLEAN): Whether match has been played
- `playedAt` (TIMESTAMP, nullable): When match was played
- `scheduledAt` (TIMESTAMP, nullable): When match is scheduled
- `vodUrl` (TEXT, nullable): Video on demand URL
- `nextMatchId` (UUID, FK → match.id, nullable): Next match in bracket
- `order` (INTEGER): Display order in bracket
- `createdAt` (TIMESTAMP): Record creation timestamp
- `updatedAt` (TIMESTAMP): Record last update timestamp

**Constraints:**
- Foreign key to `group` with CASCADE delete
- Foreign key to `division` with CASCADE delete
- Foreign key to `roster` (both) with SET NULL delete
- Self-referential foreign key to `match` with SET NULL delete
- Check constraint: Exactly one of `groupId` or `divisionId` must be set (XOR logic)

**Example:**
```json
{
  "id": "b50e8400-e29b-41d4-a716-446655440006",
  "groupId": "950e8400-e29b-41d4-a716-446655440004",
  "divisionId": null,
  "rosterAId": "750e8400-e29b-41d4-a716-446655440002",
  "rosterBId": "c50e8400-e29b-41d4-a716-446655440007",
  "teamAScore": 2,
  "teamBScore": 1,
  "draws": 0,
  "played": true,
  "playedAt": "2024-03-15T18:00:00Z",
  "scheduledAt": "2024-03-15T18:00:00Z",
  "vodUrl": "https://youtube.com/watch?v=example",
  "nextMatchId": null,
  "order": 0
}
```

## Authentication Tables

### `user`

User accounts with authentication details (defined in `auth.ts` schema).

**Columns:**
- `id` (UUID, PK): Unique identifier
- `battletag` (TEXT, UNIQUE): Battle.net username
- `role` (TEXT): User role (user/admin)
- Additional authentication-related columns

### `session`

User sessions for authentication (defined in `auth.ts` schema).

**Columns:**
- Session management columns
- User reference
- Expiration tracking

## Drizzle ORM Configuration

### Configuration File

Location: `drizzle.config.ts`

```typescript
{
  schema: "./src/lib/server/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
}
```

### Relations API

Drizzle uses a relations API for efficient querying. Relations are defined separately from tables:

```typescript
// Example relation definition
export const seasonRelations = relations(season, ({ many }) => ({
  divisions: many(division)
}));

export const divisionRelations = relations(division, ({ one, many }) => ({
  season: one(season, {
    fields: [division.seasonId],
    references: [season.id]
  }),
  groups: many(group),
  matches: many(match)
}));
```

## Database Management

### Schema Migrations

1. **Development**: `pnpm db:push`
   - Pushes schema changes directly to database
   - No migration files generated
   - Use for rapid iteration

2. **Production**: `pnpm db:generate`
   - Generates SQL migration files in `drizzle/` directory
   - Must be run before deploying schema changes
   - Migrations run automatically on application startup

### Database Studio

Drizzle Kit includes a database browser:

```bash
pnpm db:studio
```

Opens a web interface for browsing and editing database data at `https://local.drizzle.studio`.

### Seeding

Development seeding with random data:

```bash
pnpm dev -- -- --seed
```

**WARNING**: This clears all existing data!

The seeding function:
- Creates a season with multiple divisions
- Generates teams with players
- Creates group-stage and playoff matches
- Assigns random scores and dates

## Query Patterns

### Using Relations API

**Fetching a season with all divisions:**
```typescript
const season = await db.query.season.findFirst({
  where: eq(season.slug, seasonSlug),
  with: {
    divisions: {
      with: {
        groups: true
      }
    }
  }
});
```

**Fetching matches with full context:**
```typescript
const matches = await db.query.match.findMany({
  where: eq(match.groupId, groupId),
  with: {
    rosterA: {
      with: {
        members: {
          with: {
            player: true
          }
        }
      }
    },
    rosterB: {
      with: {
        members: {
          with: {
            player: true
          }
        }
      }
    }
  }
});
```

### Raw SQL Queries

For complex queries, use Drizzle's SQL builder:

```typescript
import { sql } from 'drizzle-orm';

const result = await db.execute(
  sql`SELECT * FROM ${match} WHERE ${match.played} = true`
);
```

## Performance Considerations

### Indexes

- All primary keys are automatically indexed
- Unique constraints create indexes
- Foreign keys create indexes for join performance
- Consider adding indexes on frequently filtered columns

### N+1 Query Prevention

The relations API automatically uses joins to prevent N+1 queries:

```typescript
// This generates a single query with JOINs, not N+1 queries
const rosters = await db.query.roster.findMany({
  with: {
    members: {
      with: {
        player: true
      }
    }
  }
});
```

### Connection Pooling

The database connection uses connection pooling automatically:

```typescript
export const db = drizzle({
  client: postgres(DATABASE_URL, {
    max: 10 // Connection pool size
  }),
  schema: { ...tournament, ...auth }
});
```

## Backup and Recovery

### Backup Strategy

1. **Regular Backups**: Automated PostgreSQL backups
2. **Before Migrations**: Manual backup before deploying schema changes
3. **Export Data**: Use `pg_dump` for full database exports

### Recovery Process

1. Stop application
2. Restore database from backup
3. Run any necessary migrations
4. Restart application

## Data Integrity

### Constraints

- **Foreign Key Cascades**: Automatic cleanup of related data
- **Check Constraints**: Database-level validation
- **Unique Constraints**: Prevent duplicate data
- **NOT NULL Constraints**: Required fields enforced

### Validation Layers

1. **Database**: Constraints and checks
2. **ORM**: Drizzle schema definitions
3. **Application**: Zod schemas for input validation

## Common Operations

### Creating a New Season

```typescript
const newSeason = await db.insert(season).values({
  name: "Dunderligan 2025",
  slug: "2025",
  startedAt: new Date("2025-03-01"),
  legacyRanks: false
}).returning();
```

### Recording Match Results

```typescript
await db.update(match)
  .set({
    teamAScore: 2,
    teamBScore: 1,
    played: true,
    playedAt: new Date()
  })
  .where(eq(match.id, matchId));
```

### Adding Player to Roster

```typescript
await db.insert(member).values({
  playerId: playerUUID,
  rosterId: rosterUUID,
  rank: 'diamond',
  tier: 3,
  role: 'dps',
  isCaptain: false
});
```

## Troubleshooting

### Common Issues

**Migration conflicts:**
- Delete `drizzle/` directory
- Run `pnpm db:generate` again
- Review generated SQL before deploying

**Connection errors:**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Verify network connectivity

**Schema sync issues:**
- Run `pnpm db:push` to force sync
- Check for manual database modifications
- Review Drizzle Kit output for conflicts
