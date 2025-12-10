import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: { url: process.env.DATABASE_URL! },
	verbose: true,
	strict: true,
	out: './drizzle'
});
