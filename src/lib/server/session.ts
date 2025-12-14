import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db, schema } from './db';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const TOKEN_COOKIE_NAME = 'auth-session';

function generateToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

async function create(token: string, userId: string) {
	const id = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session = {
		id,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};

	await db.insert(schema.session).values(session);
	return session;
}

async function validateToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	// query for the user and session data
	const [result] = await db
		.select({
			user: schema.user,
			session: schema.session
		})
		.from(schema.session)
		.innerJoin(schema.user, eq(schema.session.userId, schema.user.id))
		.where(eq(schema.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	// check for expired sessions
	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(schema.session).where(eq(schema.session.id, session.id));
		return { session: null, user: null };
	}

	// if the session is older than 15 days but not expired, extend its duration
	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(schema.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(schema.session.id, session.id));
	}

	return { session, user };
}

async function invalidate(sessionId: string) {
	await db.delete(schema.session).where(eq(schema.session.id, sessionId));
}

function setTokenCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(TOKEN_COOKIE_NAME, token, {
		expires: expiresAt,
		path: '/'
	});
}

function deleteTokenCookie(cookies: Cookies) {
	cookies.delete(TOKEN_COOKIE_NAME, {
		path: '/'
	});
}

export default {
	TOKEN_COOKIE_NAME,
	generateToken,
	create,
	validateToken,
	invalidate,
	setTokenCookie,
	deleteTokenCookie
};
