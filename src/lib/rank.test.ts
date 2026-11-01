import { describe, expect, it } from 'vitest';
import {
	averageLegacyRank,
	averageRank,
	formatRank,
	getRank,
	getTierLabel,
	isLegacyRank
} from '$lib/rank';
import { Rank, type AnyRank } from '$lib/types';

/** `isLegacyRank` only inspects shape, so loose inputs are fine in tests. */
const legacy = (value: unknown) => isLegacyRank(value as AnyRank);

describe('averageRank', () => {
	it('returns null for an empty list', () => {
		expect(averageRank([])).toBeNull();
	});

	it('ignores null ranks', () => {
		expect(
			averageRank([
				{ rank: null, tier: null },
				{ rank: Rank.GOLD, tier: 1 },
				{ rank: null, tier: null }
			])
		).toEqual({ rank: Rank.GOLD, tier: 1 });
	});

	it('returns null when every rank is null', () => {
		expect(
			averageRank([
				{ rank: null, tier: null },
				{ rank: null, tier: null }
			])
		).toBeNull();
	});

	it('rounds to the nearest tier', () => {
		expect(averageRank([{ rank: Rank.BRONZE, tier: 5 }])).toEqual({ rank: Rank.BRONZE, tier: 5 });
		expect(
			averageRank([
				{ rank: Rank.BRONZE, tier: 5 },
				{ rank: Rank.GOLD, tier: 1 }
			])
		).toEqual({ rank: Rank.SILVER, tier: 3 });
		expect(
			averageRank([
				{ rank: Rank.SILVER, tier: 3 },
				{ rank: Rank.GOLD, tier: 2 }
			])
		).toEqual({ rank: Rank.GOLD, tier: 5 });
	});

	it('supports the emerald rank', () => {
		expect(averageRank([{ rank: Rank.EMERALD, tier: 1 }])).toEqual({ rank: Rank.EMERALD, tier: 1 });
	});
});

describe('averageLegacyRank', () => {
	it('returns null for an empty list', () => {
		expect(averageLegacyRank([])).toBeNull();
	});

	it('returns null when every skill rating is null', () => {
		expect(averageLegacyRank([{ sr: null }, { sr: null }])).toBeNull();
	});

	it('averages and rounds the skill rating, ignoring nulls', () => {
		expect(averageLegacyRank([{ sr: 2450 }, { sr: 2404 }])).toEqual({ sr: 2427 });
		expect(averageLegacyRank([{ sr: null }, { sr: 2000 }])).toEqual({ sr: 2000 });
	});
});

describe('isLegacyRank', () => {
	it('distinguishes legacy and full ranks', () => {
		expect(legacy({ sr: 2500 })).toBe(true);
		expect(legacy({ sr: null })).toBe(true);
		expect(legacy({ rank: Rank.GOLD, tier: 2 })).toBe(false);
		expect(legacy({ rank: Rank.GOLD, tier: 2, sr: null })).toBe(false);
	});

	it('returns false for objects without a skill rating', () => {
		expect(legacy({})).toBe(false);
	});
});

describe('getRank', () => {
	it('maps legacy skill ratings to a rank', () => {
		expect(getRank({ sr: 1400 })).toBe(Rank.BRONZE);
		expect(getRank({ sr: 1500 })).toBe(Rank.SILVER);
		expect(getRank({ sr: 1999 })).toBe(Rank.SILVER);
		expect(getRank({ sr: 2000 })).toBe(Rank.GOLD);
		expect(getRank({ sr: 2500 })).toBe(Rank.PLATINUM);
		expect(getRank({ sr: 3000 })).toBe(Rank.DIAMOND);
		expect(getRank({ sr: 3500 })).toBe(Rank.MASTER);
		expect(getRank({ sr: 4000 })).toBe(Rank.GRANDMASTER);
	});

	it('returns the rank of a full rank', () => {
		expect(getRank({ rank: Rank.EMERALD, tier: 3 })).toBe(Rank.EMERALD);
		expect(getRank({ rank: Rank.CHAMPION, tier: 1 })).toBe(Rank.CHAMPION);
	});
});

describe('getTierLabel', () => {
	it('uses the tier number for full ranks', () => {
		expect(getTierLabel({ rank: Rank.GOLD, tier: 3 })).toBe('3');
	});

	it('uses the rounded skill rating in k format for legacy ranks', () => {
		expect(getTierLabel({ sr: 2500 })).toBe('2.5k');
		expect(getTierLabel({ sr: 2450 })).toBe('2.5k');
		expect(getTierLabel({ sr: 1000 })).toBe('1k');
		expect(getTierLabel({ sr: 0 })).toBe('0');
	});
});

describe('formatRank', () => {
	it('formats full and legacy ranks', () => {
		expect(formatRank({ rank: Rank.GOLD, tier: 3 })).toBe('gold 3');
		expect(formatRank({ sr: 2500 })).toBe('platinum 2.5k');
	});
});
