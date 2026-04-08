import type { GameProfile, GameProfileEntry, GameProfileEntryWithDate } from '$lib/types';
import { env } from '$env/dynamic/private';
import { createClient } from 'redis';

interface Cache {
	get(key: string): Promise<CacheRow | null>;
	set(key: string, value: CacheRow): Promise<void>;
	delete(key: string): Promise<void>;
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

			return JSON.parse(value) as CacheRow;
		},
		set: async (key: string, value: CacheRow) => {
			await redis.set(key, JSON.stringify(value));
		},
		delete: async (key: string) => {
			await redis.del(key);
		}
	};
}

function createInMemoryCache(): Cache {
	const cacheMap = new Map<string, CacheRow>();

	return {
		get: async (key: string) => cacheMap.get(key) ?? null,
		set: async (key: string, value: CacheRow) => {
			cacheMap.set(key, value);
		},
		delete: async (key: string) => {
			cacheMap.delete(key);
		}
	};
}

async function getProfileWithCache(
	battletag: string,
	slug: string | null
): Promise<GameProfileEntryWithDate> {
	let cached = await cache.get(battletag);
	if (cached) {
		const age = Date.now() - new Date(cached.date).getTime();

		if (age > REFRESH_INTERVAL) {
			// refresh in background
			searchProfilesAndCache(battletag);
		}
	} else {
		cached = await searchProfilesAndCache(battletag);
	}

	const entry = mapCacheToProfile(cached, slug);
	return { ...entry, date: cached.date };
}

function mapCacheToProfile(entry: CacheRow, slug: string | null): GameProfileEntry {
	if ('error' in entry) {
		return { status: 'error', error: entry.error };
	}

	if (entry.profiles.length === 0) {
		return { status: 'missing' };
	}

	if (entry.profiles.length > 1) {
		if (!slug) {
			return { status: 'ambiguous', candidates: entry.profiles };
		}

		const match = entry.profiles.find((c) => c.slug === slug);
		if (!match) {
			return { status: 'missing' };
		}

		return { status: 'found', profile: match };
	}

	const profile = entry.profiles[0];
	if (slug && profile.slug !== slug) {
		return { status: 'missing' };
	}

	return { status: 'found', profile };
}

type CacheRow = { date: string } & ({ profiles: GameProfile[] } | { error: string });

async function searchProfilesAndCache(battletag: string): Promise<CacheRow> {
	const cacheRow = await searchProfiles(battletag);
	await cache.set(battletag, cacheRow);
	return cacheRow;
}

async function searchProfiles(battletag: string): Promise<CacheRow> {
	const name = battletag.split('#')[0];
	const response = await fetch(
		`https://overwatch.blizzard.com/en-us/search/account-by-name/${name}/`
	);

	const date = new Date().toISOString();

	if (!response.ok) {
		return { error: `${response.status} ${response.statusText}`, date };
	}

	const data = await response.json();
	return { profiles: data.map(mapApiProfile), date };
}

function mapApiProfile(obj: any): GameProfile {
	return { avatarUrl: obj.avatar, name: obj.name, title: obj.title?.en_US, slug: obj.url };
}

async function invalidateCache(battletag: string) {
	await cache.delete(battletag);
}

export default { getProfile: getProfileWithCache, invalidateCache };
