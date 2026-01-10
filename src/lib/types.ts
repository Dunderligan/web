export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];
export type ClassValue = ClassArray | ClassDictionary | string | null | undefined;

export type FullRank = {
	rank: Rank;
	tier: number;
};

export type LegacyRank = {
	sr: number;
};

export type AnyRank = FullRank | LegacyRank;

export type NullableFullRank = {
	rank: Rank | null;
	tier: number | null;
};

export type NullableLegacyRank = {
	sr: number | null;
};

export enum Rank {
	BRONZE = 'bronze',
	SILVER = 'silver',
	GOLD = 'gold',
	PLATINUM = 'platinum',
	DIAMOND = 'diamond',
	MASTER = 'master',
	GRANDMASTER = 'grandmaster',
	CHAMPION = 'champion'
}

export enum SocialPlatform {
	YOUTUBE = 'youtube',
	TWITTER = 'twitter'
}

export enum Role {
	DAMAGE = 'damage',
	TANK = 'tank',
	SUPPORT = 'support',
	FLEX = 'flex',
	COACH = 'coach'
}

export enum MatchType {
	GROUP = 'group',
	BRACKET = 'bracket'
}

export type BaseLeague = {
	name: string;
	slug: string;
};

export type NestedSeason<S = BaseLeague> = S;
export type NestedDivision<S = BaseLeague, D = S> = D & {
	season: S;
};
export type NestedGroup<S = BaseLeague, D = S, G = S> = G & {
	division: NestedDivision<S, D>;
};

export type FlattenedSeason<S = BaseLeague> = {
	season: S;
};
export type FlattenedDivision<S = BaseLeague, D = S> = {
	season: S;
	division: D;
};
export type FlattenedGroup<S = BaseLeague, D = S, G = S> = {
	season: S;
	division: D;
	group: G;
};

export type NestedBracket<S = BaseLeague, D = S> = {
	id: string;
	name: string;
	division: NestedDivision<S, D>;
};

export type Member = {
	role: Role;
	rank: Rank | null;
	tier: number | null;
	sr: number | null;
	isCaptain: boolean;
	player: {
		id?: string | null;
		battletag: string;
	};
};

export type Roster = {
	id: string;
	name: string;
	slug: string;
	resigned?: boolean;
};

export type RosterWithGroup = Roster & {
	group: NestedGroup;
};

export type FullRoster = RosterWithGroup & {
	members: Member[];
};

export type TeamSocial = {
	platform: SocialPlatform;
	url: string;
};

/**
 * All essential match information without rosters.
 */
export type MatchWithoutRosters = {
	id: string;
	groupId?: string | null;
	divisionId?: string | null;
	createdAt?: Date;
	teamAScore: number;
	teamBScore: number;
	draws: number;
	teamANote?: string | null;
	teamBNote?: string | null;
	played: boolean;
	playedAt?: Date | null;
	scheduledAt?: Date | null;
	vodUrl?: string | null;
	nextMatchId?: string | null;
};

/**
 * A match with roster IDs that have not been resolved to full roster objects.
 */
export type UnresolvedMatch = MatchWithoutRosters & {
	rosterAId?: string | null;
	rosterBId?: string | null;
};

/**
 * A match with roster IDs and an order number within its bracket.
 */
export type UnresolvedMatchWithOrder = UnresolvedMatch & {
	order: number;
};

/**
 * A full match with resolved roster objects.
 */
export type ResolvedMatch = MatchWithoutRosters & {
	rosterA?: MatchRoster | null;
	rosterB?: MatchRoster | null;
};

/**
 * The minimal roster representation within a match.
 */
export type MatchRoster = {
	id: string;
	name: string;
	slug: string;
};

/**
 * A resolved match with its associated group and bracket context, which
 * by default is the base nested group and brackets.
 *
 * Exactly one of group or bracket should be present depending on the match type.
 */
export type ResolvedMatchWithContext<G = NestedGroup, B = NestedBracket> = ResolvedMatch & {
	group?: G | null;
	bracket?: B | null;
};

/**
 * A subset of the full match type used for logical operations,
 * e.g., calculating seeds and generating brackets.
 */
export type LogicalMatch = {
	rosterAId?: string | null;
	rosterBId?: string | null;
	teamAScore: number;
	teamBScore: number;
	draws: number;
	played: boolean;
};

export type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'negative';
