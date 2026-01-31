import session from '$lib/server/session';
import { battlenet } from '$lib/server/oauth';
import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import auth from '$lib/server/auth';

type BattlenetUserResponse = {
	sub: string;
	id: number;
	battletag: string;
};

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	const storedState = cookies.get('battlenet_oauth_state') ?? null;
	if (code === null || state === null || storedState === null || state !== storedState) {
		error(400);
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await battlenet.validateAuthorizationCode(code);
	} catch {
		// Invalid code or client credentials
		error(400);
	}

	const userResponse = await fetch('https://oauth.battle.net/userinfo', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});

	if (!userResponse.ok) {
		error(500);
	}

	const battlenetUser: BattlenetUserResponse = await userResponse.json();

	const existingUser = await auth.getUserFromBattletag(battlenetUser.battletag);
	let userId: string;

	if (existingUser) {
		userId = existingUser.id;
	} else {
		const user = await auth.createUser(battlenetUser.id, battlenetUser.battletag);
		userId = user.id;
	}

	const sessionToken = session.generateToken();
	const userSession = await session.create(sessionToken, userId);
	session.setTokenCookie(cookies, sessionToken, userSession.expiresAt);

	let next = cookies.get('oauth_next');
	if (!next || !next.startsWith('/')) {
		next = '/';
	}
	cookies.delete('oauth_next', { path: '/' });

	redirect(303, next);
};
