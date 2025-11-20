import { error, type Handle } from '@sveltejs/kit';
import session from '$lib/server/session';
import { sequence } from '@sveltejs/kit/hooks';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(session.SESSION_COOKIE_NAME);

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

export const handle: Handle = sequence(handleAuth, guardAdmin);
