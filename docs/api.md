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
type Divsision = {
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

Creates a scheduled match between two rosters. Requires a Bearer API key in the Authorization header.

Request type:

```ts
type CreateMatchRequest = {
    rosterAId: string;
    rosterBId: string;
    groupId: string;
    scheduledAt?: string; // ISO date string
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