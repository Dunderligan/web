import { command, getRequestEvent } from '$app/server';
import auth from '$lib/server/auth';
import session from '$lib/server/session';
import { error } from '@sveltejs/kit';

export const deleteAccount = command(async () => {
	const { locals, cookies } = getRequestEvent();

	if (!locals.user || !locals.session) {
		throw error(401);
	}

	await auth.deleteUser(locals.user.id);
	session.deleteTokenCookie(cookies);
});
