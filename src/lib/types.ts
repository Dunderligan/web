import type { Snippet } from 'svelte';
import type z from 'zod';
import type { matchQueryParamsSchema } from './schemas';
import type { ButtonRootProps, WithoutChildren } from 'bits-ui';

/**
 * SvelteKit accepts these types in the class attribute, but does not expose the type definitions.
 * However, it is often useful to have them for typing class props to allow more flexibility over a simple `string`.
 *
 * This code is taken from the clsx library, which SvelteKit uses internally.
 */
export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];
export type ClassValue = ClassArray | ClassDictionary | string | null | undefined;

export type ListedSeason = {
	id: string;
	name: string;
	slug: string;
	startedAt: Date;
	spinoff: boolean;
};

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

/** Available social platforms for team and player social media links. */
export enum SocialPlatform {
	YOUTUBE = 'youtube',
	TWITTER = 'twitter',
	DISCORD = 'discord',
	TWITCH = 'twitch',
	TIKTOK = 'tiktok',
	BLUESKY = 'bluesky'
}

export enum Role {
	DAMAGE = 'damage',
	TANK = 'tank',
	SUPPORT = 'support',
	FLEX = 'flex',
	COACH = 'coach',
	MANAGER = 'manager'
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
	id: string;
	name: string;
	slug: string;
};

export type BaseSeason = BaseEntity & {
	legacyRanks: boolean;
	startedAt: Date;
	spinoff: boolean;
};

// Definitions of nested entities used in various places throughout the app.
export type NestedSeason<S = BaseSeason> = S;
export type NestedDivision<S = BaseSeason, D = BaseEntity> = D & {
	season: S;
};
export type NestedGroup<S = BaseSeason, D = BaseEntity, G = BaseEntity> = G & {
	division: NestedDivision<S, D>;
};

export type FlattenedSeason<S = BaseSeason> = {
	season: S;
};
export type FlattenedDivision<S = BaseSeason, D = BaseEntity> = {
	season: S;
	division: D;
};
export type FlattenedGroup<S = BaseSeason, D = BaseEntity, G = BaseEntity> = {
	season: S;
	division: D;
	group: G;
};

export type NestedBracket<S = BaseSeason, D = BaseEntity> = {
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
	registeredName: string | null;
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

export type Social = {
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
	bracketId?: string | null;
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
	round?: number | null;
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

export type ResolvedMatchWithSeeds = MatchWithoutRosters & {
	rosterA?: MatchRosterWithSeed | null;
	rosterB?: MatchRosterWithSeed | null;
};

/**
 * The minimal roster representation within a match.
 */
export type MatchRoster = {
	id: string;
	name: string;
	slug: string;
};

export type MatchRosterWithSeed = MatchRoster & {
	seed: number;
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

export type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'destructive';

export type SeasonState = 'upcoming' | 'ongoing' | 'ended';

export type BracketWinner = {
	roster: MatchRoster;
	bracket: NestedBracket;
};

export type TournamentState = { season: BaseEntity & { startedAt: Date | null } } & (
	| { status: 'ongoing' } // active season
	| { status: 'offseason'; winners: BracketWinner[] } // season has ended before next registration is published
	| { status: 'upcoming'; registrationOpensAt: Date | null } // before registration opens
	| { status: 'registration'; registrationClosesAt: Date | null } // during registration
	| { status: 'starting'; startsAt: Date | null } // after registration closed but before season start
);

export type MatchSize = 'md' | 'sm' | 'xs';

export type MatchListProps = {
	seasonSlug?: string;
	mainRosterId?: string;
	hideIfEmpty?: boolean;
	hideDivision?: boolean;
	title?: string;
	class?: ClassValue;
	size?: MatchSize;
	matchArchiveParams?: string;
	matches: ResolvedMatchWithContext[];
};

export type DropdownItem = {
	label: string;
	icon?: string;
	hidden?: boolean;
} & (
	| { type: 'button'; href?: string; onclick?: () => void }
	| { type: 'checkbox'; checked: boolean; onchange: (value: boolean) => void }
);

export type Theme = 'light' | 'dark';

export type Preferences = {
	theme: Theme;
	spoilerMode: boolean;
};

export type GameProfile = {
	avatarUrl: string;
	name: string;
	title: string | null;
	slug: string;
};

export type GameProfileEntry =
	| { status: 'found'; profile: GameProfile }
	| { status: 'ambiguous'; candidates: GameProfile[] }
	| { status: 'missing' }
	| { status: 'error'; error: string };

export type GameProfileEntryWithDate = { date: string } & GameProfileEntry;

export type MatchQueryParams = z.infer<typeof matchQueryParamsSchema>;

export type ChipColor = 'gray' | 'yellow' | 'green' | 'accent';

export type Placement = {
	best: number;
	worst: number | null;
};

export type ButtonProps = {
	icon?: string;
	kind?: ButtonKind;
	loading?: boolean;
} & (
	| { children: Snippet; label?: never; icon?: never }
	| {
			children?: never;
			label: string;
			icon?: string;
	  }
	| {
			children?: never;
			label?: never;
			icon: string;
	  }
) &
	WithoutChildren<ButtonRootProps>;

export type SearchItem = {
	id: string;
	href: string;
	name: string;
	subtitle?: string | null;
	image?: string | null;
	type: 'player' | 'roster' | 'season';
};

export type PlayerAward = {
	id: string;
	division: NestedDivision | null;
	description: string | null;
};

export type AwardType = {
	id: string;
	name: string;
	showDivision: boolean;
	imageUrl: string | null;
};

export type Hero = {
	name: string;
	slug: string;
	role: Role;
};
