import { command, getRequestEvent, query } from '$app/server';
import session from '$lib/server/session';
import { error } from '@sveltejs/kit';

export const adminGuard = query(() => {
	const { locals } = getRequestEvent();

	if (!locals.user?.isAdmin) {
		error(401);
	}
});

export const logout = command(async () => {
	const { locals, cookies } = getRequestEvent();

	if (!locals.session) {
		return error(401);
	}

	await session.invalidate(locals.session.id);
	session.deleteTokenCookie(cookies);
});
