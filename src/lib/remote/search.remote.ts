import { query } from '$app/server';
import { db } from '$lib/server/db';
import { entityQuery, nestedGroupQuery } from '$lib/server/db/helpers';
import overwatch from '$lib/server/overwatch';
import type { SearchItem } from '$lib/types';
import {
	cdnImageSrc,
	cdnRosterLogoPath,
	compare,
	compareNullable,
	compareNullableStrings,
	flattenGroup
} from '$lib/util';
import z from 'zod';

const SEARCH_LIMIT = 10;

export const search = query(
	z.object({
		query: z.string()
	}),
	async ({ query }) => {
		if (query.trim().length < 3) {
			return {
				results: []
			};
		}

		const items = await Promise.all([
			searchPlayers(query),
			searchRosters(query),
			searchSeasons(query)
		]);

		const results = sortSearchItems(items.flat(), query);

		return {
			results
		};
	}
);

async function searchPlayers(query: string): Promise<SearchItem[]> {
	const players = await db.query.player.findMany({
		limit: SEARCH_LIMIT,
		where: {
			OR: [
				{
					battletag: {
						ilike: `%${query}%`
					}
				},
				{
					aliases: {
						name: {
							ilike: `%${query}%`
						}
					}
				}
			]
		},
		columns: {
			id: true,
			battletag: true,
			overwatchProfileSlug: true
		}
	});

	return Promise.all(
		players.map(async (player) => {
			const profile = await overwatch.getProfile(player.battletag, player.overwatchProfileSlug);

			return {
				id: player.id,
				href: `/spelare/${player.battletag.replace('#', '-')}`,
				name: player.battletag.split('#')[0],
				subtitle: 'Spelarprofil',
				type: 'player',
				image: profile.status === 'found' ? profile.profile.avatarUrl : null
			};
		})
	);
}

async function searchRosters(query: string): Promise<SearchItem[]> {
	const rosters = await db.query.roster.findMany({
		limit: SEARCH_LIMIT,
		where: {
			name: {
				ilike: `%${query}%`
			}
		},
		columns: entityQuery.columns,
		with: {
			group: nestedGroupQuery
		}
	});

	return rosters.map((roster) => {
		const { season } = flattenGroup(roster.group);

		return {
			id: roster.id,
			href: `/lag/${roster.slug}/${season.slug}`,
			name: roster.name,
			subtitle: season.name,
			type: 'roster',
			image: cdnImageSrc(cdnRosterLogoPath(roster.id), { width: 64 })
		};
	});
}

async function searchSeasons(query: string): Promise<SearchItem[]> {
	const seasons = await db.query.season.findMany({
		limit: SEARCH_LIMIT,
		where: {
			name: {
				ilike: `%${query}%`
			}
		},
		columns: entityQuery.columns
	});

	return seasons.map((season) => {
		return {
			id: season.id,
			href: `/stallningar/${season.slug}`,
			name: season.name,
			type: 'season'
		};
	});
}

function sortSearchItems(items: SearchItem[], query: string): SearchItem[] {
	const lowerQuery = query.toLowerCase();

	return items.sort((a, b) => {
		const aLower = a.name.toLowerCase();
		const bLower = b.name.toLowerCase();

		return (
			longestCommonPrefix(bLower, lowerQuery) - longestCommonPrefix(aLower, lowerQuery) ||
			compareNullableStrings(aLower, bLower) ||
			compareNullableStrings(a.subtitle, b.subtitle)
		);
	});
}

function longestCommonPrefix(a: string, b: string): number {
	const minLength = Math.min(a.length, b.length);
	let i = 0;
	while (i < minLength && a[i] === b[i]) {
		i++;
	}
	return i;
}
