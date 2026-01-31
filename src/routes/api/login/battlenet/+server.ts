import { generateState } from 'arctic';
import { battlenet } from '$lib/server/oauth';

import { redirect } from '@sveltejs/kit';

export const GET = async ({ cookies, url }) => {
	const state = generateState();
	const redirectUrl = battlenet.createAuthorizationURL(state, []);

	const next = url.searchParams.get('next');
	if (next) {
		cookies.set('oauth_next', next, {
			path: '/'
		});
	}

	cookies.set('battlenet_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	redirect(303, redirectUrl);
};
