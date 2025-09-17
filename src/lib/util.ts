import slugify from 'slugify';
import {
	SocialPlatform,
	type FullRank,
	type NestedGroup,
	type Rank,
	type Role,
	type FullRoster,
	type Roster,
	type Match
} from './types';

const rankNums: Record<Rank, number> = {
	bronze: 0,
	silver: 1,
	gold: 2,
	platinum: 3,
	diamond: 4,
	master: 5,
	grandmaster: 6,
	champion: 7
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

export function formatSocialPlatform(platform: SocialPlatform) {
	switch (platform) {
		case SocialPlatform.TWITTER:
			return 'Twitter';
		case SocialPlatform.YOUTUBE:
			return 'Youtube';
	}
}

export function flattenGroup(group: NestedGroup) {
	return {
		group: {
			name: group.name,
			slug: group.slug
		},
		division: {
			name: group.division.name,
			slug: group.division.slug
		},
		season: {
			name: group.division.season.name,
			slug: group.division.season.slug
		}
	};
}

export function toSlug(str: string) {
	return slugify(str, {
		lower: true,
		locale: 'sv-SE'
	});
}

type TableScore = {
	mapWins: number;
	mapLosses: number;
	mapDraws: number;
	matchesPlayed: number;
};

export function calculateStandings(rosters: { id: string }[], matches: Omit<Match, 'groupId'>[]) {
	const rosterScores = new Map<string, TableScore>();

	for (const roster of rosters) {
		rosterScores.set(roster.id, { mapWins: 0, mapLosses: 0, mapDraws: 0, matchesPlayed: 0 });
	}

	for (const match of matches) {
		if (!match.played || !match.rosterAId || !match.rosterBId) continue;

		const teamA = rosterScores.get(match.rosterAId);
		const teamB = rosterScores.get(match.rosterBId);

		if (!teamA || !teamB) {
			console.warn('Roster not found in group', match);
			continue;
		}

		teamA.mapWins += match.teamAScore ?? 0;
		teamA.mapLosses += match.teamBScore ?? 0;
		teamA.mapDraws += match.draws ?? 0;

		teamB.mapWins += match.teamBScore ?? 0;
		teamB.mapLosses += match.teamAScore ?? 0;
		teamB.mapDraws += match.draws ?? 0;

		teamA.matchesPlayed += 1;
		teamB.matchesPlayed += 1;
	}

	const sortedRosters = rosterScores
		.entries()
		.map(([rosterId, score]) => ({
			rosterId,
			score
		}))
		.toArray()
		.sort(
			(b, a) => a.score.mapWins - b.score.mapWins || a.score.matchesPlayed - b.score.matchesPlayed
		);

	return sortedRosters;
}

export function sortBySeed(rosters: { id: string }[], matches: Omit<Match, 'groupId'>[]) {
	const seeds = new Map(
		calculateStandings(rosters, matches).map((row, seed) => [row.rosterId, seed])
	);

	return rosters.sort((a, b) => seeds.get(a.id)! - seeds.get(b.id)!);
}
