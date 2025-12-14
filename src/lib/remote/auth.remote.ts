import { command, getRequestEvent, query } from '$app/server';
import { db, schema } from '$lib/server/db';
import session from '$lib/server/session';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const adminGuard = query(() => {
	const { locals } = getRequestEvent();

	if (!locals.user?.isAdmin) {
		error(403);
	}
});

export const superAdminGuard = query(() => {
	const { locals } = getRequestEvent();

	if (!locals.user?.isSuperAdmin) {
		error(403);
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

export const createSuperUser = command(
	z.object({
		battletag: z.string().nonempty()
	}),
	async ({ battletag }) => {
		const existing = await db.query.user.findFirst();

		if (existing) {
			// already set up
			error(404);
		}

		const [user] = await db
			.insert(schema.user)
			.values({
				isAdmin: true,
				isSuperAdmin: true,
				battlenetId: 0,
				battletag
			})
			.returning();

		const { cookies } = getRequestEvent();

		const token = session.generateToken();
		const userSession = await session.create(token, user.id);
		session.setTokenCookie(cookies, token, userSession.expiresAt);

		return { user };
	}
);

export const updateUsers = command(
	z.object({
		users: z.array(
			z.object({
				id: z.uuid(),
				isAdmin: z.boolean()
			})
		)
	}),
	async ({ users }) => {
		await superAdminGuard();

		await db.transaction(async (tx) => {
			for (const user of users) {
				await tx
					.update(schema.user)
					.set({ isAdmin: user.isAdmin })
					.where(eq(schema.user.id, user.id));
			}
		});
	}
);
