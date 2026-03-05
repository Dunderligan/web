import slugify from 'slugify';
import { browser } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';
import {
	type FlattenedDivision,
	type FlattenedGroup,
	type NestedDivision,
	type NestedGroup,
	Role,
	type SeasonState,
	SocialPlatform
} from './types';

/** Returns a readable version of a SocialPlatform. */
export function formatSocialPlatform(platform: SocialPlatform) {
	switch (platform) {
		case SocialPlatform.TWITTER:
			return 'Twitter';
		case SocialPlatform.YOUTUBE:
			return 'Youtube';
	}
}

/** Flattens a nested division. ({ division: { season } } -> { division, season }) */
export function flattenDivision<S, D>(
	nestedDivision: NestedDivision<S, D>
): FlattenedDivision<S, D> {
	const { season, ...division } = nestedDivision;

	// cast to D since TS can't infer that the rest operator gives us a D
	return { season, division: division as D };
}

/** Flattens a nested group. ({ group: { division: { season } } } -> { group, division, season }) */
export function flattenGroup<S, D, G>(nestedGroup: NestedGroup<S, D, G>): FlattenedGroup<S, D, G> {
	const { division: nestedDivision, ...group } = nestedGroup;
	const { season, division } = flattenDivision(nestedDivision);

	// see above for why we need to cast
	return { season, division, group: group as G };
}

/** Converts a string to a URL-friendly slug. */
export function toSlug(str: string) {
	return slugify(str, {
		lower: true,
		locale: 'sv-SE'
	});
}

/**
 * Returns a url to the CDN endpoint (specified via environment variable) with a path appended.
 * The path must be prefixed with a forward slash.
 */
export function cdnSrc(path: string) {
	return `${PUBLIC_CDN_ENDPOINT}${path}`;
}

/**
 * Returns a url to the Cloudflare Images endpoint with the specified transformations applied.
 * See https://developers.cloudflare.com/images/transform-images/transform-via-url/ for details.
 *
 * This assumes Images is configured on top of the CDN domain (called zones by cloudflare).
 */
export function cdnImageSrc(path: string, { width, height }: { width: number; height?: number }) {
	let filters = `format=auto,fit=scale-down,width=${width}`;
	if (height) {
		filters += `,height=${height}`;
	}

	return cdnSrc(`/cdn-cgi/image/${filters}${path}`);
}

/** Returns the CDN path (as used with cdnSrc) for a roster logo. */
export function cdnRosterLogoPath(rosterId: string) {
	return `/${s3RosterLogoKey(rosterId)}`;
}

/** Returns the S3 key for a roster logo. */
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
			return 'ph:clipboard';
		case 'manager':
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

/** Maps an empty string to `undefined`, otherwise returns the string. */
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
}): SeasonState {
	const now = new Date();
	if (startedAt && now < startedAt) {
		return 'upcoming';
	}
	if (endedAt && now > endedAt) {
		return 'ended';
	}
	return 'ongoing';
}

function isWithinWeek(a: Date, b: Date) {
	const diff = a.getTime() - b.getTime();
	if (diff < 0) return false; // a is before b
	return diff <= 7 * 24 * 60 * 60 * 1000; // 7 days
}

/** Formats a date in a readable way, without time. */
export function formatDate(date: Date, extra?: any): string {
	const isThisWeek = isWithinWeek(date, new Date());
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	return date.toLocaleDateString('sv-SE', {
		...(isThisWeek ? { weekday: 'long' } : { day: 'numeric', month: 'short' }),
		// only show year if not current year
		...(isCurrentYear ? {} : { year: 'numeric' }),
		...extra
	});
}

/** Formats a date in a readable way, with time. */
export function formatDateTime(date: Date): string {
	return formatDate(date, {
		hour: '2-digit',
		minute: '2-digit'
	});
}

/** Shortens a team name to a string of 3 characters. */
export function shortenTeamName(name: string) {
	const words = name.replace(/[():]/g, '').toUpperCase().split(' ');
	if (words.length === 1) return words[0].slice(0, 3);
	if (words.length === 2) return words[0].slice(0, 2) + words[1][0];
	return words
		.slice(0, 3)
		.map((word) => word[0])
		.join('');
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

const COOKIE_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export function setCookie(name: string, value: string) {
	const expires = new Date(Date.now() + COOKIE_EXPIRATION_MS);
	if (browser) {
		document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}`;
	} else {
		const { cookies } = getRequestEvent();
		cookies.set(name, value, { path: '/', httpOnly: false, expires });
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
