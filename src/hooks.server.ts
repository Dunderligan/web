import { error, type Handle, type ServerInit } from '@sveltejs/kit';
import session from '$lib/server/session';
import { sequence } from '@sveltejs/kit/hooks';
import { initDb } from '$lib/server/db';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(session.TOKEN_COOKIE_NAME);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
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

const guardAdmin: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/admin')) {
		return resolve(event);
	}

	if (!event.locals.user?.isAdmin) {
		error(403);
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

export const handle: Handle = sequence(handleAuth, guardAdmin, preloadFonts);

export const init: ServerInit = async () => {
	await initDb();
};
