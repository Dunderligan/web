import slugify from 'slugify';
import {
	SocialPlatform,
	type FullRank,
	type NestedGroup,
	type Rank,
	type Role,
	type FullMatch
} from './types';
// import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';

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
	let total = 0;

	for (const rank of ranks) {
		total += rankNums[rank.rank] * 5 + (5 - rank.tier);
	}

	const avg = Math.round(total / ranks.length);

	const rankNum = Math.floor(avg / 5);
	const rank = Object.keys(rankNums).find((key) => rankNums[key as Rank] === rankNum) as Rank;
	const tier = 5 - (avg % 5);

	return {
		rank,
		tier
	};
}

const roleNums: Record<Role, number> = {
	tank: 0,
	damage: 1,
	support: 2,
	flex: 3,
	coach: 4
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

export function flattenGroup<S, D, G>(nestedGroup: NestedGroup<S, D, G>) {
	const { division: nestedDivision, ...group } = nestedGroup;
	const { season, ...division } = nestedDivision;

	return { season, division, group };
}

export function toSlug(str: string) {
	return slugify(str, {
		lower: true,
		locale: 'sv-SE'
	});
}

export type TableScore = {
	mapWins: number;
	mapLosses: number;
	mapDraws: number;
	matchesPlayed: number;
};

type MatchWithoutIds = Omit<FullMatch, 'id' | 'groupId' | 'played' | 'order'>;

export function calculateStandings(
	rosters: { id: string }[],
	matches: MatchWithoutIds[]
): {
	rosterId: string;
	score: TableScore;
}[] {
	const rosterScores = new Map<string, TableScore>();

	for (const roster of rosters) {
		rosterScores.set(roster.id, { mapWins: 0, mapLosses: 0, mapDraws: 0, matchesPlayed: 0 });
	}

	for (const match of matches) {
		if (!match.rosterAId || !match.rosterBId) continue;

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

export function sortBySeed(rosters: { id: string }[], matches: MatchWithoutIds[]) {
	const seeds = new Map(
		calculateStandings(rosters, matches).map((row, seed) => [row.rosterId, seed])
	);

	return rosters.sort((a, b) => seeds.get(a.id)! - seeds.get(b.id)!);
}

export function buildBracket<T extends { id: string; nextMatchId?: string | null }>(matches: T[]) {
	const finalMatch = matches.find((match) => !match.nextMatchId);

	if (!finalMatch) {
		console.warn('No final match found!');
		return [];
	}

	const rounds: T[][] = [];
	let currentRound = [finalMatch];

	while (currentRound.length > 0) {
		rounds.unshift(currentRound);

		const nextRoundIds = new Set(currentRound.map((match) => match.id));
		const prevRound = matches.filter(
			(match) => match.nextMatchId && nextRoundIds.has(match.nextMatchId)
		);

		currentRound = prevRound;
	}

	return rounds;
}

export function cdnImageSrc(path: string, { width, height }: { width: number; height?: number }) {
	let filters = `format=auto,fit=scale-down,width=${width}`;
	if (height) {
		filters += `,height=${height}`;
	}

	// return `${PUBLIC_CDN_ENDPOINT}/cdn-cgi/image/${filters}/dunderligan${path}`;
	return `https://cdn.kesomannen.com/cdn-cgi/image/${filters}/dunderligan${path}`;
}

export function capitalize(str: string) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function roleIcon(role: Role): string {
	switch (role) {
		case 'tank':
			return 'mdi:shield-outline';
		case 'damage':
			return 'mdi:sword-cross';
		case 'support':
			return 'mdi:band-aid';
		case 'flex':
			return 'mdi:anonymous';
		case 'coach':
			return 'mdi:brain';
	}

	return 'mdi:help';
}

export function aggregateGroups<R, M>(groups: { rosters: R[]; matches: M[] }[]) {
	return {
		rosters: groups.flatMap((group) => group.rosters),
		matches: groups.flatMap((group) => group.matches)
	};
}

export function mapEmptyToUndefined(str: string) {
	if (str.length === 0) return undefined;
	return str;
}

export function enumToPgEnum<T extends Record<string, any>>(
	myEnum: T
): [T[keyof T], ...T[keyof T][]] {
	return Object.values(myEnum).map((value: any) => `${value}`) as any;
}
