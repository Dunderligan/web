import { command, getRequestEvent, query } from '$app/server';
import { AuthRole, canPromoteTo, checkPermission } from '$lib/authRole';
import { db, schema } from '$lib/server/db';
import session from '$lib/server/session';
import { error } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import z from 'zod';

export const roleGuard = query(z.enum(AuthRole), (required) => {
	const { locals } = getRequestEvent();

	const role = locals.user?.role;

	if (!checkPermission(role, required)) {
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

export const createSuperAdmin = command(
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
				role: AuthRole.SUPER_ADMIN,
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
				role: z.enum(AuthRole)
			})
		)
	}),
	async ({ users }) => {
		// if we get a lot of people who log in, this might need to be split up to
		// update individual users instead of everyone at once

		const { locals } = getRequestEvent();

		// Fetch current roles to prevent privilege escalation attacks
		const ids = users.map((u) => u.id);
		const existingUsers = await db
			.select({ id: schema.user.id, role: schema.user.role })
			.from(schema.user)
			.where(inArray(schema.user.id, ids));

		const currentRoles = new Map(existingUsers.map((u) => [u.id, u.role]));

		await db.transaction(async (tx) => {
			for (const user of users) {
				if (!canPromoteTo(locals.user?.role, user.role)) {
					throw error(403);
				}

				// Also check permission over the user's current role to prevent demoting
				// users whose role is equal to or higher than the requester's role
				const currentRole = currentRoles.get(user.id);
				if (!currentRole || !canPromoteTo(locals.user?.role, currentRole)) {
					throw error(403);
				}

				await tx.update(schema.user).set({ role: user.role }).where(eq(schema.user.id, user.id));
			}
		});
	}
);
