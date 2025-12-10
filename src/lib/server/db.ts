import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '$env/dynamic/private';
import { seed as seed } from './db/seed';
import { dev } from '$app/environment';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import relations from './db/relations';
import * as tournament from './db/schema/tournament';
import * as auth from './db/schema/auth';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const schema = {
	...tournament,
	...auth
};

const db = drizzle(env.DATABASE_URL, { schema, relations, casing: 'snake_case' });

if (!dev) {
	await migrate(db, { migrationsFolder: './drizzle' });
}

if (dev && process.argv.includes('--seed')) {
	await seed(db);
}

export { db, schema };
