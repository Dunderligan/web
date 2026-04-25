The site has a small public API, documented here. All paths are prefixed with `/api` (for example, the full URL to the first endpoint is https://dunderligan.se/api/season).

An API key is required for some routes. These can currently only be created by admins in the admin panel. The client provides the API key in the `Authorization` header as a `Bearer` token.

---

```
GET /season
```

Returns all seasons with divisions, groups and brackets.

Response type:

```ts
type SeasonResponse = {
  seasons: Season[]
}

type Season = {
  id: string;
  name: string;
  slug: string;
  legacyRanks: boolean;
  hidden: boolean;
  startedAt: string;
  endedAt: string | null;
  divisions: Division[];
}

type Division = {
    id: string;
    name: string;
    slug: string;
    groups: Group[];
    brackets: Bracket[];
}

type Group = {
    id: string;
    name: string;
    slug: string;
}

type Bracket = {
    id: string;
    name: string;
}
```

---

```
GET /division/[id]
```

Returns groups, rosters and brackets for one division.

Response type:

```ts
type DivisionResponse = {
    id: string;
    name: string;
    slug: string;
    season: Season;
    groups: Group[];
    brackets: Bracket[];
}

type Season = {
  id: string;
  name: string;
  slug: string;
}

type Group = {
    id: string;
    name: string;
    slug: string;
    rosters: Roster[];
}

type Roster = {
    id: string;
    name: string;
    slug: string;
}

type Bracket = {
    id: string;
    name: string;
}
```

---

```
GET /division/[id]/standings
```

Returns standings for a division.

Response type:

```ts
type DivisionStandings = {
    tables: Table[]
};

type Table = {
    name: string;
    standings: {
        score: TableScore;
        roster: Roster;
    }[];
}

type Roster = {
    id: string;
    name: string;
    slug: string;
}

type TableScore = {
	mapWins: number;
	mapLosses: number;
	mapDraws: number;
	matchesPlayed: number;
};
```

---

```
GET /roster/[id]
```

Returns roster with players, group, division and season.

Response type:

```ts
type Roster = {
    id: string;
    name: string;
    slug: string;
    group: Group;
    team: Team;
    members: Member[];
}

type Group = {
    id: string;
    name: string;
    slug: string;
    division: Division;
}

type Division = {
    id: string;
    name: string;
    slug: string;
    season: Season;
}

type Season = {
    id: string;
    name: string;
    slug: string;
    legacyRanks: boolean;
}

type Member = {
    rank: Rank | null;
    role: Role;
    tier: number | null;
    sr: number | null;
    isCaptain: boolean;
    player: {
        battletag: string;
    };
}

type Team = {
    id: string;
}

type Rank = 'champion' | 'grandmaster' | 'master' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';

type Role = 'tank' | 'damage' | 'support' | 'flex' | 'coach' | 'manager';
```

---

```
POST /match
```

Creates a scheduled match between two rosters. Requires an API key with moderator privileges or higher.

Request type:

```ts
type CreateMatchRequest = {
    rosterAId: string;
    rosterBId: string;
    groupId: string;
    scheduledAt: string | null; // ISO date string
}
```

Response type:

```ts
type Match = {
    id: string;
    createdAt: string;
    groupId: string | null;
    bracketId: string | null;
    rosterAId: string | null;
    rosterBId: string | null;
    teamAScore: number;
    teamBScore: number;
    draws: number;
    teamANote: string | null;
    teamBNote: string | null;
    state: MatchState;
    playedAt: string | null;
    scheduledAt: string | null;
    vodUrl: string | null;
    nextMatchId: string | null;
    order: number;
}

type MatchState = 'scheduled' |'played' | 'walkover' | 'cancelled'
```

---

```
GET /match
```

Returns matches, filtered by query parameters.

All parameters are optional, and if multiple parameters are provided, they are combined with AND logic. They are as follows:

- `rosterId`: string - filter matches where this roster is either rosterA or rosterB.
- `divisionId`: string - filter matches in this division.
- `seasonId`: string - filter matches in this season.
- `isBracket`: boolean - if true, only return bracket matches. If false, only return group matches.
- `state`: MatchState[] - filter matches in any of these states, delimited by comma. The filter can also be negated by prefixing the parameter with `!`, for example `state=!scheduled,cancelled` will return matches that are not scheduled or cancelled.
- `page`: number - for pagination, zero-based.
- `pageSize`: number - for pagination, number of items per page.

Response type:

```ts
type MatchResponse = {
    results: Match[];
    hasNextPage: boolean;
}

type Match = {
    id: string;
	teamAScore: number;
	teamBScore: number;
	draws: number;
	teamANote: string | null;
	teamBNote: string | null;
	state: MatchState;
	playedAt: string | null; // ISO date string
	scheduledAt: string | null; // ISO date string
	vodUrl: string | null;
	nextMatchId: string | null;
    rosterA: MatchRoster | null;
    rosterB: MatchRoster | null;
    // exactly one of these are be null
    group: Group | null,
    bracket: Bracket | null;
}

type MatchRoster = {
    id: string;
    name: string;
    slug: string;
}

type Group = {
    id: string;
    name: string;
    slug: string;
    division: Division;
}

type Bracket = {
    id: string;
    name: string;
    division: Division;
}

type Division = {
    id: string;
    name: string;
    slug: string;
    season: Season;
}

type Season = {
    id: string;
    name: string;
    slug: string;
    legacyRanks: boolean;
    startedAt: string | null; // ISO date string
}

type MatchState = 'scheduled' | 'played' | 'walkover' | 'cancelled';
```
