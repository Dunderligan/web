import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { seed as seed } from './db/seed';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

const db = drizzle(client, { schema, casing: 'snake_case' });

if (process.argv.includes('--seed')) {
	await seed(db);
}

export { db, schema };
