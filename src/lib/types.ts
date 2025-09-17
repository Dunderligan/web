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

export type NestedGroup = {
	name: string;
	slug: string;
	division: {
		name: string;
		slug: string;
		season: {
			name: string;
			slug: string;
		};
	};
};

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
	group: NestedGroup;
	members: Member[];
	team?: never;
};

export type TeamSocial = {
	platform: SocialPlatform;
	url: string;
};

export type Match = {
	groupId: string;
	id: string;
	type?: MatchType;
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
