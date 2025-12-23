import slugify from 'slugify';
import {
	Rank,
	SocialPlatform,
	type FullRank,
	type NestedGroup,
	type Role,
	type NestedDivision,
	type NullableFullRank,
	type NullableLegacyRank,
	type LegacyRank,
	type AnyRank
} from './types';
import { browser } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';

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

export function averageRank(ranks: NullableFullRank[]): FullRank | null {
	if (ranks.length === 0) {
		return null;
	}

	let total = 0;
	let nonNullCount = 0;

	for (const { rank, tier } of ranks) {
		if (!rank || !tier) continue;
		nonNullCount++;
		console.log(rankToNum({ rank, tier }));
		total += rankToNum({ rank, tier });
	}

	return numToRank(total / nonNullCount);
}

function rankToNum(rank: FullRank): number {
	// map the rank to a whole number, then a fraction based on tier
	// instead of 5-1 where 1 is the highest, we invert it to 0-0.8 where 0.8 (tier 1) is the highest
	return rankNums[rank.rank] + (5 - rank.tier) / 5;
}

function numToRank(num: number): FullRank {
	const rankNum = Math.floor(num);
	const rank = Object.keys(rankNums).find((key) => rankNums[key as Rank] === rankNum) as Rank;

	const tier = 5 - Math.round((num - rankNum) * 5);

	return {
		rank,
		tier
	};
}

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

export function getRank(rank: AnyRank): Rank {
	if ('rank' in rank) {
		return rank.rank;
	} else {
		if (rank.sr < 1500) return Rank.BRONZE;
		if (rank.sr < 2000) return Rank.SILVER;
		if (rank.sr < 2500) return Rank.GOLD;
		if (rank.sr < 3000) return Rank.PLATINUM;
		if (rank.sr < 3500) return Rank.DIAMOND;
		if (rank.sr < 4000) return Rank.MASTER;
		return Rank.GRANDMASTER;
	}
}

export function getTierLabel(rank: AnyRank): string {
	if ('rank' in rank) {
		return rank.tier.toString();
	} else {
		return `${Math.round(rank.sr / 100) / 10.0}k`;
	}
}

export function isLegacyRank(rank: AnyRank): boolean {
	if ('sr' in rank) {
		return true;
	}
	return false;
}

export function formatSocialPlatform(platform: SocialPlatform) {
	switch (platform) {
		case SocialPlatform.TWITTER:
			return 'Twitter';
		case SocialPlatform.YOUTUBE:
			return 'Youtube';
	}
}

export function flattenDivision<S, D>(nestedDivision: NestedDivision<S, D>) {
	const { season, ...division } = nestedDivision;
	return { season, division };
}

export function flattenGroup<S, D, G>(nestedGroup: NestedGroup<S, D, G>) {
	const { division: nestedDivision, ...group } = nestedGroup;
	const { season, division } = flattenDivision(nestedDivision);

	return { season, division, group };
}

export function toSlug(str: string) {
	return slugify(str, {
		lower: true,
		locale: 'sv-SE'
	});
}

export function cdnSrc(path: string) {
	return `${PUBLIC_CDN_ENDPOINT}${path}`;
}

export function cdnImageSrc(path: string, { width, height }: { width: number; height?: number }) {
	let filters = `format=auto,fit=scale-down,width=${width}`;
	if (height) {
		filters += `,height=${height}`;
	}

	return cdnSrc(`/cdn-cgi/image/${filters}${path}`);
}

export function cdnRosterLogoPath(rosterId: string) {
	return `/${s3RosterLogoKey(rosterId)}`;
}

export function s3RosterLogoKey(rosterId: string) {
	return `logos/${rosterId}.webp`;
}

export function capitalize(str: string) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function roleIcon(role: Role): string {
	switch (role) {
		case 'tank':
			return 'ph:shield';
		case 'damage':
			return 'ph:sword';
		case 'support':
			return 'ph:bandaids';
		case 'flex':
			return 'ph:star';
		case 'coach':
			return 'ph:suitcase';
	}

	return 'ph:question-mark';
}

/** Aggregate a number of groups into single collections of rosters and matches. */
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

export function seasonState({
	startedAt,
	endedAt
}: {
	startedAt: Date;
	endedAt?: Date | null;
}): 'upcoming' | 'ongoing' | 'ended' {
	const now = new Date();
	if (startedAt && now < startedAt) {
		return 'upcoming';
	}
	if (endedAt && now > endedAt) {
		return 'ended';
	}
	return 'ongoing';
}

export function formatDate(date: Date, extra?: any): string {
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	return date.toLocaleDateString('sv-SE', {
		month: 'long',
		day: 'numeric',
		// only show year if not current year
		...(isCurrentYear ? {} : { year: 'numeric' }),
		...extra
	});
}

export function formatDateTime(date: Date): string {
	return formatDate(date, {
		hour: '2-digit',
		minute: '2-digit'
	});
}

/** Client/server agnostic cookie functions */

export async function getCookie(name: string): Promise<string | null> {
	if (browser) {
		const cookie = await cookieStore.get(name);
		return cookie?.value ?? null;
	} else {
		const { cookies } = getRequestEvent();
		return cookies.get(name) ?? null;
	}
}

export function setCookie(name: string, value: string) {
	if (browser) {
		document.cookie = `${name}=${value}; path=/;`;
	} else {
		const { cookies } = getRequestEvent();
		cookies.set(name, value, { path: '/', httpOnly: false });
	}
}

export async function deleteCookie(name: string) {
	if (browser) {
		await cookieStore.delete(name);
	} else {
		const { cookies } = getRequestEvent();
		cookies.delete(name, { path: '/', httpOnly: false });
	}
}
