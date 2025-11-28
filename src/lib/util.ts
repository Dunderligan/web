import slugify from 'slugify';
import {
	SocialPlatform,
	type FullRank,
	type NestedGroup,
	type Rank,
	type Role,
	type FullMatch,
	type NestedDivision,
	type LogicalMatch
} from './types';
// import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';

const PUBLIC_CDN_ENDPOINT = 'https://cdn.dunderligan.se';

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

	return `${PUBLIC_CDN_ENDPOINT}/cdn-cgi/image/${filters}${path}`;
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

export function formatDate(date: Date): string {
	// format as YYYY-MM-DD in sv-SE locale
	return date.toLocaleDateString('sv-SE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatDateTime(date: Date): string {
	// format as YYYY-MM-DD HH:mm in sv-SE locale
	return date.toLocaleDateString('sv-SE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}
