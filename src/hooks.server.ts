import { error, type Handle, type ServerInit } from '@sveltejs/kit';
import session from '$lib/server/session';
import { sequence } from '@sveltejs/kit/hooks';
import { initDb } from '$lib/server/db';
import { isModerator } from '$lib/authRole';
import apiToken from '$lib/server/apiToken';

const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;

	const authHeader = event.request.headers.get('Authorization');

	if (authHeader) {
		if (!authHeader.startsWith('Bearer ')) {
			throw error(401, 'Invalid Authorization header');
		}

		const token = authHeader.substring('Bearer '.length);
		const { key, user } = await apiToken.validateToken(token);

		if (!key || !user) {
			throw error(401, 'Invalid API token');
		}

		event.locals.user = user;

		return resolve(event);
	}

	// fallback to session auth
	const sessionToken = event.cookies.get(session.TOKEN_COOKIE_NAME);

	if (!sessionToken) {
		return resolve(event);
	}

	const { session: userSession, user } = await session.validateToken(sessionToken);

	if (userSession) {
		session.setTokenCookie(event.cookies, sessionToken, userSession.expiresAt);
	} else {
		session.deleteTokenCookie(event.cookies);
	}

	event.locals.user = user;
	event.locals.session = userSession;

	return resolve(event);
};

const guardAdminPages: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/admin')) {
		return resolve(event);
	}

	if (!isModerator(event.locals.user?.role)) {
		throw error(403);
	}

	return resolve(event);
};

const preloadFonts: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		preload: ({ type, path }) => {
			return (type === 'font' && path.endsWith('.woff2')) || type === 'css' || type === 'js';
		}
	});
};

export const handle: Handle = sequence(handleAuth, guardAdminPages, preloadFonts);

export const init: ServerInit = async () => {
	await initDb();
};
