import { db } from '$lib/server/db';
import { entityQuery, memberQuery, nestedGroupQuery } from '$lib/server/db/helpers';
import { error } from 'console';

export const load = async ({ params }) => {
	const battletag = params.battletag.replace('-', '#');

	const player = await db.query.player.findFirst({
		where: {
			battletag
		},
		columns: {
			id: true,
			battletag: true,
			description: true,
			pronouns: true
		},
		with: {
			socials: {
				columns: {
					platform: true,
					url: true
				}
			},
			memberships: {
				columns: memberQuery.columns,
				with: {
					roster: {
						...entityQuery,
						with: {
							group: nestedGroupQuery
						}
					}
				}
			},
			signatureHeroes: {
				columns: {},
				with: {
					hero: {
						columns: {
							name: true
						}
					}
				}
			},
			aliases: {
				columns: {
					name: true
				}
			}
		}
	});

	if (!player) {
		throw error(404);
	}

	const { avatarUrl, title } = await fetchBattlenetInfoWithCache(battletag);

	return {
		player,
		avatarUrl,
		title
	};
};

const cache = new Map<string, { info: BattlenetInfo; date: Date }>();

const REFRESH_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours

type BattlenetInfo = {
	avatarUrl: string | null;
	title: string | null;
};

async function fetchBattlenetInfoWithCache(battletag: string): Promise<BattlenetInfo> {
	const cached = cache.get(battletag);
	if (cached) {
		const age = Date.now() - cached.date.getTime();
		if (age > REFRESH_INTERVAL) {
			// refresh in background
			fetchBattlenetInfoAndInsertIntoCache(battletag);
		}
		return cached.info;
	}

	return await fetchBattlenetInfoAndInsertIntoCache(battletag);
}

async function fetchBattlenetInfoAndInsertIntoCache(battletag: string): Promise<BattlenetInfo> {
	const info = await fetchBattlenetInfo(battletag);
	cache.set(battletag, { info, date: new Date() });
	return info;
}

async function fetchBattlenetInfo(battletag: string): Promise<BattlenetInfo> {
	const name = battletag.split('#')[0];
	const response = await fetch(
		`https://overwatch.blizzard.com/en-us/search/account-by-name/${name}/`
	);

	if (!response.ok) {
		return { avatarUrl: null, title: null };
	}

	const data = await response.json();
	if (data.length !== 1) {
		return { avatarUrl: null, title: null };
	}

	return { avatarUrl: data[0].avatar, title: data[0].title?.en_US };
}
