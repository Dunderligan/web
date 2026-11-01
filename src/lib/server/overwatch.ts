import type { GameProfile, GameProfileEntry, GameProfileEntryWithDate } from '$lib/types';
import { env } from '$env/dynamic/private';
import { createClient } from 'redis';
import z from 'zod';

const apiProfileSchema = z.object({
	isPublic: z.boolean(),
	lastUpdated: z.number(),
	namecard: z.url(),
	avatar: z.url(),
	title: z.record(z.string(), z.string()).nullable(),
	url: z.string(),
	name: z.string()
});

type ApiProfile = z.infer<typeof apiProfileSchema>;

type CacheRow = { date: string } & ({ profiles: GameProfile[] } | { error: string });

interface Cache {
	get(key: string): Promise<CacheRow | null>;
	set(key: string, value: CacheRow): Promise<void>;
	delete(key: string): Promise<void>;
}

class OverwatchProfiles {
	#cache: Cache;
	#refreshInterval: number;

	constructor(cache: Cache, refreshInterval: number) {
		this.#cache = cache;
		this.#refreshInterval = refreshInterval;
	}

	/**
	 * Looks up a player's Overwatch profile, using the cache when available.
	 * Stale entries are returned immediately and refreshed in the background.
	 */
	async getProfile(battletag: string, slug: string | null): Promise<GameProfileEntryWithDate> {
		let cached = await this.#cache.get(battletag);

		if (cached) {
			const age = Date.now() - new Date(cached.date).getTime();

			if (age > this.#refreshInterval) {
				// Refresh in the background, but return the stale entry for now.
				this.#searchProfilesAndCache(battletag);
			}
		} else {
			cached = await this.#searchProfilesAndCache(battletag);
		}

		return { ...this.#mapCacheToProfile(cached, slug), date: cached.date };
	}

	/** Removes a player's cached profile, forcing a fresh lookup on the next request. */
	async invalidateCache(battletag: string): Promise<void> {
		await this.#cache.delete(battletag);
	}

	async #searchProfilesAndCache(battletag: string): Promise<CacheRow> {
		const cacheRow = await this.#searchProfiles(battletag);
		await this.#cache.set(battletag, cacheRow);
		return cacheRow;
	}

	#mapCacheToProfile(entry: CacheRow, slug: string | null): GameProfileEntry {
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

			const match = entry.profiles.find((candidate) => candidate.slug === slug);
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

	async #searchProfiles(battletag: string): Promise<CacheRow> {
		const name = battletag.split('#')[0];
		const date = new Date().toISOString();

		try {
			const response = await fetch(
				`https://overwatch.blizzard.com/en-us/search/account-by-name/${name}/`
			);

			if (!response.ok) {
				return { error: `${response.status} ${response.statusText}`, date };
			}

			const content = await response.json();

			const result: ApiProfile[] = apiProfileSchema.array().parse(content);
			const mappedProfiles = result.map((obj) => this.#mapApiProfile(obj));
			return { profiles: mappedProfiles, date };
		} catch (error) {
			console.error('Error fetching Overwatch profile:', error);
			return { error: 'Failed to fetch profile', date: new Date().toISOString() };
		}
	}

	#mapApiProfile(profile: ApiProfile): GameProfile {
		return {
			avatarUrl: profile.avatar,
			name: profile.name,
			title: profile.title?.en_US ?? null,
			slug: profile.url
		};
	}
}

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

/** How long a cached profile is considered fresh before it is refreshed in the background. */
const REFRESH_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours

let cache: Cache;

if (env.REDIS_URL) {
	cache = await connectRedis();
} else {
	console.warn('REDIS_URL not set, using in-memory cache for Overwatch profile info.');
	cache = createInMemoryCache();
}

const overwatch = new OverwatchProfiles(cache, REFRESH_INTERVAL);

export default overwatch;
