import { env } from '$env/dynamic/private';
import { createClient } from 'redis';
import { InMemoryPresenceStore, RedisPresenceStore, type PresenceStore } from './presence-store';

async function connectRedis(): Promise<PresenceStore> {
	const client = createClient({ url: env.REDIS_URL });
	client.on('error', (err) => console.error('Redis presence client error', err));
	await client.connect();

	return new RedisPresenceStore(client);
}

let store: PresenceStore;

if (env.REDIS_URL) {
	store = await connectRedis();
} else {
	console.warn(
		'REDIS_URL not set, using in-memory pick and ban presence. This is only correct with a single app instance.'
	);
	store = new InMemoryPresenceStore();
}

export default store;
