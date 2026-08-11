import {
	Rank,
	type FullRank,
	type NullableLegacyRank,
	type LegacyRank,
	type AnyRank,
	type NullableFullRank
} from './types';

const rankNums: Record<Rank, number> = {
	bronze: 0,
	silver: 1,
	gold: 2,
	platinum: 3,
	emerald: 4,
	diamond: 5,
	master: 6,
	grandmaster: 7,
	champion: 8
};

/** Averages a list of ranks. Null ranks are ignored. If the list is empty, returns null. */
export function averageRank(ranks: NullableFullRank[]): FullRank | null {
	if (ranks.length === 0) {
		return null;
	}

	let total = 0;
	let nonNullCount = 0;

	for (const { rank, tier } of ranks) {
		if (!rank || !tier) continue; // null rank

		nonNullCount++;
		total += rankToNum({ rank, tier });
	}

	return numToRank(total / nonNullCount);
}

function rankToNum(rank: FullRank): number {
	// map the rank to a multiple of 5, then the tier as the smallest digit
	// instead of the tier being 5-1 where 1 is the highest, we invert it to 0-4 where 4 (tier 1) is the highest
	// the range becomes 0 (bronze 5) to 39 (champion 1)
	return rankNums[rank.rank] * 5 + (5 - rank.tier);
}

function numToRank(num: number): FullRank {
	const rounded = Math.round(num);

	const rankNum = Math.floor(rounded / 5);
	const rank = Object.keys(rankNums).find((key) => rankNums[key as Rank] === rankNum) as Rank;

	const tier = 5 - (rounded % 5);

	return {
		rank,
		tier
	};
}

/** Averages a list of legacy ranks. Null ranks are ignored. If the list is empty, returns null. */
export function averageLegacyRank(ranks: NullableLegacyRank[]): LegacyRank | null {
	if (ranks.length === 0) {
		return null;
	}

	let total = 0;
	let nonNullCount = 0;

	for (const { sr } of ranks) {
		if (sr === null) continue;
		nonNullCount++;
		total += sr;
	}

	return { sr: Math.round(total / nonNullCount) };
}

/** Returns the rank component of a full rank or legacy rank (bronze, silver, gold, e.t.c.). */
export function getRank(rank: AnyRank): Rank {
	if (isLegacyRank(rank)) {
		if (rank.sr < 1500) return Rank.BRONZE;
		if (rank.sr < 2000) return Rank.SILVER;
		if (rank.sr < 2500) return Rank.GOLD;
		if (rank.sr < 3000) return Rank.PLATINUM;
		if (rank.sr < 3500) return Rank.DIAMOND;
		if (rank.sr < 4000) return Rank.MASTER;
		return Rank.GRANDMASTER;
	} else {
		return rank.rank;
	}
}

/**
 * Returns the label that should accompany the rank icon when displayed.
 * For full ranks, this is the tier number (1-5), while legacy ranks the SR in 'k' format (e.g. 2.5k).
 */
export function getTierLabel(rank: AnyRank): string {
	if (isLegacyRank(rank)) {
		// round to nearest 100th with one decimal place
		return `${Math.round(rank.sr / 100) / 10.0}k`;
	} else {
		return rank.tier.toString();
	}
}

/** Returns whether the given rank is a legacy rank. */
export function isLegacyRank(rank: AnyRank): rank is LegacyRank {
	if ('sr' in rank) {
		return true;
	}
	return false;
}
