import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '$env/dynamic/private';
import { seed as seed } from './db/seed';
import { dev } from '$app/environment';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import relations from './db/relations';
import schema from './db/schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const db = drizzle(env.DATABASE_URL, {
	schema,
	relations,
	casing: 'snake_case'
});

if (!dev) {
	await migrate(db, { migrationsFolder: './drizzle' });
}

if (dev && process.argv.includes('--seed')) {
	await seed(db);
}

export { db, schema };
