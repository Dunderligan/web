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
	SUPPORT = 'support'
}

export enum MatchType {
	GROUP = 'group',
	BRACKET = 'bracket'
}

export type BaseGroupInfo = {
	name: string;
	slug: string;
};

export type NestedGroup<S, D, G> = G & {
	division: D & { season: S };
};

export type BaseNestedGroup = NestedGroup<BaseGroupInfo, BaseGroupInfo, BaseGroupInfo>;

export type Member = {
	rank: Rank;
	tier: number;
	role: Role;
	isCaptain: boolean;
	player: {
		id: string | null;
		battletag: string;
	};
};

export type Roster = {
	id: string;
	name: string;
	slug: string;
};

export type FullRoster = Roster & {
	seasonSlug: string;
	group: BaseNestedGroup;
	members: Member[];
	team?: never;
};

export type TeamSocial = {
	platform: SocialPlatform;
	url: string;
};

export type Match = {
	id: string;
	groupId?: string | null;
	divisionId?: string | null;
	createdAt?: Date;
	rosterAId?: string | null;
	rosterBId?: string | null;
	teamAScore?: number | null;
	teamBScore?: number | null;
	draws?: number | null;
	played?: boolean;
	playedAt?: Date | null;
	scheduledAt?: Date | null;
	vodUrl?: string | null;
	nextMatchId?: string | null;
};
