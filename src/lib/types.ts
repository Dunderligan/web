export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];
export type ClassValue = ClassArray | ClassDictionary | string | null | undefined;

export type FullRank = {
	rank: Rank;
	tier: number;
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

export type Member = {
	rank: Rank;
	tier: number;
	role: Role;
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

export type FullMatch = {
	id: string;
	groupId?: string | null;
	divisionId?: string | null;
	createdAt?: Date;
	rosterAId?: string | null;
	rosterBId?: string | null;
	teamAScore?: number | null;
	teamBScore?: number | null;
	draws?: number | null;
	played: boolean;
	playedAt?: Date | null;
	scheduledAt?: Date | null;
	vodUrl?: string | null;
	nextMatchId?: string | null;
	order: number;
};

export type FullMatchWithoutOrder = Omit<FullMatch, 'order'>;

export type ResolvedMatch = {
	id: string;
	played: boolean;
	teamAScore?: number | null;
	teamBScore?: number | null;
	draws?: number | null;
	rosterA?: MatchRoster | null;
	rosterB?: MatchRoster | null;
	playedAt?: Date | null;
	scheduledAt?: Date | null;
	vodUrl?: string | null;
};

export type MatchRoster = {
	id: string;
	name: string;
	slug: string;
};

export type ResolvedMatchWithContext<G = NestedGroup, D = NestedDivision> = ResolvedMatch & {
	group: G | null;
	division: D | null;
};

/**
 * A subset of the full match type used for logical operations,
 * e.g., calculating seeds and generating brackets.
 */
export type LogicalMatch = {
	rosterAId?: string | null;
	rosterBId?: string | null;
	teamAScore?: number | null;
	teamBScore?: number | null;
	draws?: number | null;
	played: boolean;
};

export type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'negative';
