import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from '$env/static/private';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	socialProviders: {
		discord: {
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});
