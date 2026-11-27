import { drizzle } from 'drizzle-orm/postgres-js';
import { DATABASE_URL } from '$app/env/private';
import { seed } from './db/seed';
import { dev } from '$app/env';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import relations from './db/relations';
import schema from './db/schema';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const db = drizzle(DATABASE_URL, { schema, relations, casing: 'snake_case' });

async function initDb() {
	if (!dev && !process.argv.includes('--no-migrate')) {
		await migrate(db, { migrationsFolder: './drizzle' });
	}

	if (dev && process.argv.includes('--seed')) {
		await seed(db);
	}
}

export { db, schema, initDb };
