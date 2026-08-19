import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { findOrCreatePlayer, type Transaction } from '$lib/server/db/helpers';
import { type Member, type Social } from '$lib/types';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/authRole';
import { memberSchema, socialSchema } from '$lib/schemas';
import s3 from '$lib/server/s3';
import cdn from '$lib/cdn';

/// Create a roster and add it to a group. If an associated teamId is not provided, a new team will be created.
export const createRoster = command(
	z.object({
		groupId: z.uuidv4(),
		name: z.string().nonempty(),
		teamId: z.uuidv4().nullish()
	}),
	async ({ groupId, name, teamId }) => {
		await roleGuard(AuthRole.ADMIN);

		if (!teamId) {
			const [team] = await db.insert(schema.team).values({}).returning();
			teamId = team.id;
		}

		const slug = toSlug(name);

		const [roster] = await db
			.insert(schema.roster)
			.values({
				name,
				slug,
				groupId,
				teamId
			})
			.returning({ id: schema.roster.id });

		return { roster };
	}
);

export const deleteRoster = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.roster).where(eq(schema.roster.id, id));

		await s3.deleteFile(cdn.rosterLogoKey(id));

		// TODO: also delete logos when rosters are deleted from cascades (deleting groups e.t.c.)
	}
);

export const editRoster = command(
	z.object({
		id: z.string(),
		name: z.string().optional(),
		teamId: z.string().optional(),
		resigned: z.boolean().optional(),
		members: z.array(memberSchema).optional(),
		socials: z.array(socialSchema).optional()
	}),
	async ({ id, teamId, name, resigned, members, socials }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.transaction(async (tx) => {
			const tasks = [];

			if (name || resigned !== undefined) {
				tasks.push(updateInfo(tx, id, name, resigned));
			}

			if (members) {
				tasks.push(updateMembers(tx, id, members));
			}

			if (socials && teamId) {
				tasks.push(updateSocials(tx, teamId, socials));
			}

			await Promise.all(tasks);
		});
	}
);

async function updateInfo(tx: Transaction, rosterId: string, name?: string, resigned?: boolean) {
	const newSlug = name ? toSlug(name) : undefined;

	await tx
		.update(schema.roster)
		.set({
			name,
			slug: newSlug,
			resigned
		})
		.where(eq(schema.roster.id, rosterId));
}

async function updateMembers(tx: Transaction, rosterId: string, members: Member[]) {
	// delete all the members and insert them again
	// there is probably a more efficient way to do this
	await tx.delete(schema.member).where(eq(schema.member.rosterId, rosterId));

	const memberInserts = await Promise.all(
		members.map(async ({ player, ...member }) => {
			// if they already have an associated id, use that
			const playerId = player.id ?? (await findOrCreatePlayer(tx, player.battletag));

			return {
				playerId,
				rosterId: rosterId,
				...member
			};
		})
	);

	if (memberInserts.length > 0) {
		await tx.insert(schema.member).values(memberInserts);
	}
}

async function updateSocials(tx: Transaction, teamId: string, socials: Social[]) {
	await tx.delete(schema.teamSocial).where(eq(schema.teamSocial.teamId, teamId));

	const inserts = socials.map(({ platform, url }) => ({
		teamId: teamId,
		platform,
		url
	}));

	if (inserts.length > 0) {
		await tx.insert(schema.teamSocial).values(inserts);
	}
}

export const uploadRosterLogo = command(
	z.object({
		rosterId: z.uuid(),
		file: z.instanceof(ArrayBuffer)
	}),
	async ({ rosterId, file }) => {
		await roleGuard(AuthRole.ADMIN);

		await s3.uploadImage(file, cdn.rosterLogoKey(rosterId));
	}
);

export const mergeTeams = command(
	z.object({
		teamAId: z.uuid(),
		teamBId: z.uuid()
	}),
	async ({ teamAId, teamBId }) => {
		await roleGuard(AuthRole.ADMIN);

		// set all rosters in teamB to teamA
		await db
			.update(schema.roster)
			.set({ teamId: teamAId })
			.where(eq(schema.roster.teamId, teamBId));
	}
);

export const moveRoster = command(
	z.object({
		rosterId: z.uuid(),
		groupId: z.uuid()
	}),
	async ({ rosterId, groupId }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.update(schema.roster).set({ groupId }).where(eq(schema.roster.id, rosterId));
	}
);
