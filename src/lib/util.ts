const rankNums = {
	bronze: 0,
	silver: 1,
	gold: 2,
	platinum: 3,
	diamond: 4,
	master: 5,
	grandmaster: 6,
	champion: 7
};

export type FullRank = {
	rank: Rank;
	tier: number;
};

export function averageRank(ranks: FullRank[]): FullRank {
	// convert the ranks to decimal numbers using the record above
	const rankNumbers = ranks
		.map((fullRank) => rankNums[fullRank.rank] + (fullRank.tier - 1) / 5)
		.reduce((a, b) => a + b, 0);

	const average = rankNumbers / ranks.length;
	const rank = Object.entries(rankNums)
		.reverse()
		.find(([_, num]) => num <= average) ?? ['bronze', 0];
	const tier = Math.round((average - (rank[1] ?? 0)) * 5) + 1;

	return { rank: rank[0] as Rank, tier };
}

const roleNums: Record<Role, number> = {
	tank: 0,
	damage: 1,
	support: 2
};

export function sortRole(a: Role, b: Role) {
	return roleNums[a] - roleNums[b];
}

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
