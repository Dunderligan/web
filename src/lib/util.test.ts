import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	aggregateGroups,
	capitalize,
	compare,
	compareNullable,
	compareNullableStrings,
	compareRoles,
	flattenDivision,
	flattenGroup,
	formatDate,
	formatDateShort,
	formatDateTime,
	formatDateTimeShort,
	formatSocialPlatform,
	formatSubmissionStatus,
	getSeasonState,
	isOrganizationRole,
	isPlayerRole,
	mapEmptyToUndefined,
	parseMatchQueryParams,
	roleIcon,
	shortenTeamName,
	socialMediaPlatformDomains,
	toSlug
} from '$lib/util';
import { MatchState, Role, SocialPlatform, SubmissionStatus } from '$lib/types';

describe('formatSocialPlatform / socialMediaPlatformDomains', () => {
	it('maps platforms to display names', () => {
		expect(formatSocialPlatform(SocialPlatform.TWITTER)).toBe('Twitter');
		expect(formatSocialPlatform(SocialPlatform.YOUTUBE)).toBe('Youtube');
		expect(formatSocialPlatform(SocialPlatform.DISCORD)).toBe('Discord');
		expect(formatSocialPlatform(SocialPlatform.TWITCH)).toBe('Twitch');
		expect(formatSocialPlatform(SocialPlatform.TIKTOK)).toBe('TikTok');
		expect(formatSocialPlatform(SocialPlatform.BLUESKY)).toBe('Bluesky');
	});

	it('maps platforms to their domains', () => {
		expect(socialMediaPlatformDomains(SocialPlatform.TWITTER)).toEqual(['twitter.com', 'x.com']);
		expect(socialMediaPlatformDomains(SocialPlatform.YOUTUBE)).toEqual(['youtube.com', 'youtu.be']);
		expect(socialMediaPlatformDomains(SocialPlatform.DISCORD)).toEqual([]);
		expect(socialMediaPlatformDomains(SocialPlatform.TWITCH)).toEqual(['twitch.tv']);
		expect(socialMediaPlatformDomains(SocialPlatform.TIKTOK)).toEqual(['tiktok.com']);
		expect(socialMediaPlatformDomains(SocialPlatform.BLUESKY)).toEqual(['bsky.app']);
	});
});

describe('capitalize', () => {
	it('uppercases the first character', () => {
		expect(capitalize('dunder')).toBe('Dunder');
		expect(capitalize('Dunder')).toBe('Dunder');
		expect(capitalize('å')).toBe('Å');
	});

	it('leaves the empty string untouched', () => {
		expect(capitalize('')).toBe('');
	});
});

describe('toSlug', () => {
	it('lowercases and hyphenates', () => {
		expect(toSlug('Hello World')).toBe('hello-world');
	});

	it('transliterates Swedish characters', () => {
		expect(toSlug('Röda Björnarna')).toBe('roda-bjornarna');
	});

	it('does not include extra dashes', () => {
		expect(toSlug('Hello - World')).toBe('hello-world');
	});

	it('preserves symbols', () => {
		expect(toSlug('Njukas + 4')).toBe('njukas-+-4');
		expect(toSlug('Hej!')).toBe('hej!');
	});
});

describe('mapEmptyToUndefined', () => {
	it('maps an empty string to undefined and keeps others', () => {
		expect(mapEmptyToUndefined('')).toBeUndefined();
		expect(mapEmptyToUndefined('x')).toBe('x');
	});
});

describe('shortenTeamName', () => {
	it('takes the first three letters of a single word', () => {
		expect(shortenTeamName('Dragons')).toBe('DRA');
		expect(shortenTeamName('Go')).toBe('GO');
		expect(shortenTeamName('A')).toBe('A');
	});

	it('uses the first two letters plus the initial for two words', () => {
		expect(shortenTeamName('Red Dragons')).toBe('RED');
	});

	it('uses the initials for three or more words', () => {
		expect(shortenTeamName('Red Blue Green')).toBe('RBG');
		expect(shortenTeamName('Red Blue Green White')).toBe('RBG');
	});

	it('strips parentheses and colons before shortening', () => {
		expect(shortenTeamName('(Team) A: B')).toBe('TAB');
	});
});

describe('roleIcon', () => {
	it('maps roles to icons', () => {
		expect(roleIcon(Role.TANK)).toBe('ph:shield');
		expect(roleIcon(Role.DAMAGE)).toBe('ph:sword');
		expect(roleIcon(Role.SUPPORT)).toBe('ph:bandaids');
		expect(roleIcon(Role.FLEX)).toBe('ph:star');
		expect(roleIcon(Role.COACH)).toBe('ph:clipboard');
		expect(roleIcon(Role.MANAGER)).toBe('ph:suitcase');
	});
});

describe('aggregateGroups', () => {
	it('flattens rosters and matches across groups', () => {
		const groups = [
			{ rosters: ['a'], matches: ['m1'] },
			{ rosters: ['b', 'c'], matches: ['m2'] }
		];

		expect(aggregateGroups(groups)).toEqual({ rosters: ['a', 'b', 'c'], matches: ['m1', 'm2'] });
	});
});

describe('flattenDivision / flattenGroup', () => {
	const season = { id: 's', name: 'S', slug: 's' };
	const division = { id: 'd', name: 'D', slug: 'd', season };
	const group = { id: 'g', name: 'G', slug: 'g', division };

	it('flattens a nested division', () => {
		expect(flattenDivision(division)).toEqual({
			season,
			division: { id: 'd', name: 'D', slug: 'd' }
		});
	});

	it('flattens a nested group', () => {
		expect(flattenGroup(group)).toEqual({
			season,
			division: { id: 'd', name: 'D', slug: 'd' },
			group: { id: 'g', name: 'G', slug: 'g' }
		});
	});
});

describe('compare helpers', () => {
	it('compare orders values', () => {
		expect(compare(1, 2)).toBe(-1);
		expect(compare(2, 1)).toBe(1);
		expect(compare(1, 1)).toBe(0);
	});

	it('compareNullable sorts null first', () => {
		expect(compareNullable(null, null)).toBe(0);
		expect(compareNullable(null, 1)).toBe(-1);
		expect(compareNullable(1, null)).toBe(1);
		expect(compareNullable(1, 2)).toBe(-1);
	});

	it('compareNullableStrings treats undefined as null', () => {
		expect(compareNullableStrings(undefined, 'b')).toBeLessThan(0);
		expect(compareNullableStrings('a', 'b')).toBe(-1);
		expect(compareNullableStrings(null, null)).toBe(0);
	});

	it('compareRoles follows the canonical role order', () => {
		expect(compareRoles(Role.TANK, Role.DAMAGE)).toBeLessThan(0);
		expect(compareRoles(Role.DAMAGE, Role.SUPPORT)).toBeLessThan(0);
		expect(compareRoles(Role.SUPPORT, Role.FLEX)).toBeLessThan(0);
		expect(compareRoles(Role.FLEX, Role.COACH)).toBeLessThan(0);
		expect(compareRoles(Role.COACH, Role.MANAGER)).toBeLessThan(0);
	});
});

describe('role helpers', () => {
	it('classifies player and organisation roles', () => {
		expect(isPlayerRole(Role.DAMAGE)).toBe(true);
		expect(isPlayerRole(Role.TANK)).toBe(true);
		expect(isPlayerRole(Role.COACH)).toBe(false);
		expect(isOrganizationRole(Role.COACH)).toBe(true);
		expect(isOrganizationRole(Role.MANAGER)).toBe(true);
		expect(isOrganizationRole(Role.TANK)).toBe(false);
	});
});

describe('formatSubmissionStatus', () => {
	it('translates the statuses', () => {
		expect(formatSubmissionStatus(SubmissionStatus.PENDING)).toBe('Väntar');
		expect(formatSubmissionStatus(SubmissionStatus.APPROVED)).toBe('Godkänd');
		expect(formatSubmissionStatus(SubmissionStatus.REJECTED)).toBe('Nekad');
	});
});

describe('parseMatchQueryParams', () => {
	it('applies defaults for empty params', () => {
		expect(parseMatchQueryParams(new URLSearchParams())).toEqual({
			rosterId: undefined,
			divisionId: undefined,
			seasonId: undefined,
			page: 0,
			isBracket: undefined,
			hasDate: undefined,
			includeEmpty: false,
			pageSize: undefined,
			state: undefined
		});
	});

	it('parses states, with inversion using "!"', () => {
		expect(parseMatchQueryParams(new URLSearchParams('state=scheduled,played')).state).toEqual([
			MatchState.SCHEDULED,
			MatchState.PLAYED
		]);
		expect(parseMatchQueryParams(new URLSearchParams('state=!scheduled,played')).state).toEqual([
			MatchState.WALKOVER,
			MatchState.CANCELLED
		]);
	});

	it('drops unrecognised states', () => {
		expect(parseMatchQueryParams(new URLSearchParams('state=bogus')).state).toEqual([]);
	});

	it('parses booleans and numbers', () => {
		const params = parseMatchQueryParams(
			new URLSearchParams(
				'isBracket=true&hasDate=false&includeEmpty=true&page=2&pageSize=25&rosterId=abc'
			)
		);

		expect(params.isBracket).toBe(true);
		expect(params.hasDate).toBe(false);
		expect(params.includeEmpty).toBe(true);
		expect(params.page).toBe(2);
		expect(params.pageSize).toBe(25);
		expect(params.rosterId).toBe('abc');
	});

	it('ignores unrecognised boolean values', () => {
		expect(parseMatchQueryParams(new URLSearchParams('isBracket=yes')).isBracket).toBeUndefined();
	});
});

describe('getSeasonState', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('reports upcoming, ongoing and ended seasons', () => {
		expect(getSeasonState({ startedAt: new Date('2026-07-01T00:00:00Z') })).toBe('upcoming');
		expect(getSeasonState({ startedAt: new Date('2026-05-01T00:00:00Z') })).toBe('ongoing');
		expect(
			getSeasonState({
				startedAt: new Date('2026-05-01T00:00:00Z'),
				endedAt: new Date('2026-05-15T00:00:00Z')
			})
		).toBe('ended');
	});
});

describe('date formatting', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 10, 9, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('formats dates with the Swedish locale, showing the year only when different', () => {
		expect(formatDate(new Date(2026, 2, 5))).toBe('5 mars');
		expect(formatDate(new Date(2020, 2, 5))).toBe('5 mars 2020');
	});

	it('formats dates with time', () => {
		expect(formatDateTime(new Date(2026, 2, 5, 13, 45))).toBe('5 mars kl. 13:45');
	});

	it('uses the weekday for dates within the coming week', () => {
		expect(formatDateShort(new Date(2026, 2, 12))).toBe('torsdag');
		expect(formatDateTimeShort(new Date(2026, 2, 12, 13, 45))).toBe('torsdag 13:45');
	});

	it('falls back to a short date outside the week', () => {
		expect(formatDateShort(new Date(2026, 3, 20))).toBe('20 apr.');
	});
});
