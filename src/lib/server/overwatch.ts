import type { GameProfile, GameProfileEntry, GameProfileEntryWithDate } from '$lib/types';
import { env } from '$env/dynamic/private';
import { createClient } from 'redis';

interface Cache {
	get(key: string): Promise<GameProfileEntryWithDate | null>;
	set(key: string, value: GameProfileEntryWithDate): Promise<void>;
}

let cache: Cache;

if (env.REDIS_URL) {
	cache = await connectRedis();
} else {
	console.warn('REDIS_URL not set, using in-memory cache for Overwatch profile info.');
	cache = createInMemoryCache();
}

const REFRESH_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours

async function connectRedis(): Promise<Cache> {
	const redis = createClient({ url: env.REDIS_URL });
	redis.on('error', (err) => console.error('Redis Client Error', err));
	await redis.connect();

	return {
		get: async (key: string) => {
			const value = await redis.get(key);
			if (!value) return null;

			return JSON.parse(value) as GameProfileEntryWithDate;
		},
		set: async (key: string, value: GameProfileEntryWithDate) => {
			await redis.set(key, JSON.stringify(value));
		}
	};
}

function createInMemoryCache(): Cache {
	const cacheMap = new Map<string, GameProfileEntryWithDate>();

	return {
		get: async (key: string) => cacheMap.get(key) ?? null,
		set: async (key: string, value: GameProfileEntryWithDate) => {
			cacheMap.set(key, value);
		}
	};
}

async function getProfileWithCache(battletag: string): Promise<GameProfileEntryWithDate> {
	const cached = await cache.get(battletag);
	if (cached) {
		const age = Date.now() - new Date(cached.date).getTime();

		if (age > REFRESH_INTERVAL) {
			// refresh in background
			getProfileAndCache(battletag);
		}
		return cached;
	}

	return await getProfileAndCache(battletag);
}

async function getProfileAndCache(battletag: string): Promise<GameProfileEntryWithDate> {
	const profile = await getProfile(battletag);
	const entry = { ...profile, date: new Date().toISOString() };

	await cache.set(battletag, entry);
	return entry;
}

async function getProfile(battletag: string): Promise<GameProfileEntry> {
	const name = battletag.split('#')[0];
	const response = await fetch(
		`https://overwatch.blizzard.com/en-us/search/account-by-name/${name}/`
	);

	if (!response.ok) {
		return { status: 'error', error: `${response.status} ${response.statusText}` };
	}

	const data = await response.json();
	if (data.length === 0) {
		return { status: 'missing' };
	} else if (data.length > 1) {
		return { status: 'ambiguous' };
	}

	const profile = { avatarUrl: data[0].avatar, title: data[0].title?.en_US };
	return { status: 'found', profile };
}

export default { getProfile: getProfileWithCache };
