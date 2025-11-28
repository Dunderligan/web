import { dev } from '$app/environment';
import { db, schema } from '$lib/server/db';
import session from '$lib/server/session';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, cookies }) => {
	if (!dev) {
		error(404);
	}

	const battletag = params.user;

	if (!battletag) {
		error(400, 'Username slug is missing.');
	}

	const [user] = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.battletag, battletag))
		.limit(1);

	if (!user) {
		error(401, 'User does not exist.');
	}

	const sessionToken = session.generateToken();
	const userSession = await session.create(sessionToken, user.id);
	session.setTokenCookie(cookies, sessionToken, userSession.expiresAt);

	redirect(303, '/');
};
