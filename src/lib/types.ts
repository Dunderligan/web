/**
 * SvelteKit accepts these types in the class attribute, but does not expose the type definitions.
 * However, it is often useful to have them for typing class props to allow more flexibility over a simple `string`.
 *
 * This code is taken from the clsx library, which SvelteKit uses internally.
 */
export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];
export type ClassValue = ClassArray | ClassDictionary | string | null | undefined;

/** Full rank representation with rank (bronze, silver, etc.) and tier (1-5 where 1 is the highest). */
export type FullRank = {
	rank: Rank;
	tier: number;
};

/**
 * Full rank with the fields nullable.
 * This is useful for database queries, where these two are separate, nullable fields.
 * Both fields should either be null or non-null together.
 */
export type NullableFullRank = {
	rank: Rank | null;
	tier: number | null;
};

/** Legacy rank from Overwatch 1, consisting of a single skill rating number. */
export type LegacyRank = {
	sr: number;
};

export type NullableLegacyRank = {
	sr: number | null;
};

/** Either a full rank or a legacy rank. */
export type AnyRank = FullRank | LegacyRank;

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

/** Available social platforms for team social media links. */
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

export enum MatchState {
	SCHEDULED = 'scheduled',
	PLAYED = 'played',
	WALKOVER = 'walkover',
	CANCELLED = 'cancelled'
}

/**
 * Base information used to identify seasons, divisions, groups, etc.
 * Often used in nested types from database queries.
 * See the $lib/server/db/helpers.ts file for the equivalent query definition.
 */
export type BaseEntity = {
	name: string;
	slug: string;
};

// Definitions of nested entities used in various places throughout the app.
export type NestedSeason<S = BaseEntity> = S;
export type NestedDivision<S = BaseEntity, D = S> = D & {
	season: S;
};
export type NestedGroup<S = BaseEntity, D = S, G = S> = G & {
	division: NestedDivision<S, D>;
};

export type FlattenedSeason<S = BaseEntity> = {
	season: S;
};
export type FlattenedDivision<S = BaseEntity, D = S> = {
	season: S;
	division: D;
};
export type FlattenedGroup<S = BaseEntity, D = S, G = S> = {
	season: S;
	division: D;
	group: G;
};

export type NestedBracket<S = BaseEntity, D = S> = {
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
 * All essential match information but without rosters.
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
	state: MatchState;
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
 * Exactly one of group or bracket should be present, depending on the match type.
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
	state: MatchState;
};

export type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'negative';

export type SeasonState = 'upcoming' | 'ongoing' | 'ended';

export type Winner = {
	roster: MatchRoster;
	bracket: BaseEntity;
};

export type TournamentState = { season: BaseEntity & { startedAt: Date | null } } & (
	| { status: 'ongoing' } // active season
	| { status: 'offseason'; winners: Winner[] } // season has ended before next registration is published
	| { status: 'upcoming'; registrationOpensAt: Date | null } // before registration opens
	| { status: 'registration'; registrationClosesAt: Date | null } // during registration
	| { status: 'starting' } // after registration closed but before season start
);
