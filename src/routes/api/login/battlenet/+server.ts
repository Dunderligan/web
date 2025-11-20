import { generateState } from 'arctic';
import { battlenet } from '$lib/server/oauth';

import { redirect } from '@sveltejs/kit';

export const GET = async ({ cookies }) => {
	const state = generateState();
	const url = battlenet.createAuthorizationURL(state, []);

	cookies.set('battlenet_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	redirect(302, url);
};
