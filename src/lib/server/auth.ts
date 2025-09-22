import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import {
	BATTLENET_CLIENT_ID,
	BATTLENET_CLIENT_SECRET,
	BETTER_AUTH_SECRET
} from '$env/static/private';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { genericOAuth } from 'better-auth/plugins';

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'user',
				input: false
			}
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
					authorizationUrl: 'https://oauth.battle.net/authorize',
					tokenUrl: 'https://oauth.battle.net/token',
					redirectURI: 'http://localhost:5173/api/auth/callback/battlenet',
					scopes: ['openid'],
					getUserInfo: async (tokens) => {
						const result = await fetch('https://oauth.battle.net/userinfo', {
							headers: {
								Authorization: `Bearer ${tokens.accessToken}`
							}
						}).then((res) => res.json());

						return {
							id: result.id,
							name: result.battletag,
							// better-auth requires an email, but battle.net doesn't return one
							// this fake email format is borrowed from the X/Twitter OAuth plugin
							email: `${result.id}@https://battle.net`,
							emailVerified: true,
							createdAt: new Date(),
							updatedAt: new Date()
						};
					}
				}
			]
		})
	]
});
