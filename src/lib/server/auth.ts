import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import {
	BATTLENET_CLIENT_ID,
	BATTLENET_CLIENT_SECRET,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET
} from '$env/static/private';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { genericOAuth } from 'better-auth/plugins';

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
	plugins: [
		sveltekitCookies(getRequestEvent),
		genericOAuth({
			config: [
				{
					providerId: 'battlenet',
					clientId: BATTLENET_CLIENT_ID,
					clientSecret: BATTLENET_CLIENT_SECRET,
					discoveryUrl: 'https://oauth.battle.net/.well-known/openid-configuration',
					scopes: ['openid']
				}
			]
		})
	]
});
