import { command } from '$app/server';
import { S3_BUCKET_NAME } from '$env/static/private';
import { db, schema } from '$lib/server/db';
import { findOrCreatePlayer, type Transaction } from '$lib/server/db/helpers';
import S3 from '$lib/server/s3';
import { Rank, Role, type Member, type Social } from '$lib/types';
import { cdnRosterLogoPath, s3RosterLogoKey, toSlug } from '$lib/util';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/authRole';
import sharp from 'sharp';
import { socialSchema } from '$lib/schemas';

/// Create a roster and add it to a group. If an associated teamId is not provided, a new team will be created.
export const createRoster = command(
	z.object({
		groupId: z.uuidv4(),
		seasonSlug: z.string(),
		name: z.string().nonempty(),
		teamId: z.uuidv4().nullish()
	}),
	async ({ groupId, seasonSlug, name, teamId }) => {
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

		// TODO: also delete logos when rosters are deleted from cascades (deleting groups e.t.c.)
		const command = new DeleteObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: cdnRosterLogoPath(id)
		});

		await S3.send(command);
	}
);

export const editRoster = command(
	z.object({
		id: z.string(),
		teamId: z.string(),
		name: z.string(),
		resigned: z.boolean(),
		members: z.array(
			z.object({
				role: z.enum(Role),
				rank: z.enum(Rank).nullable(),
				tier: z.int().max(5).min(1).nullable(),
				sr: z.int().min(0).nullable(),
				isCaptain: z.boolean(),
				registeredName: z.string().nullable(),
				player: z.object({
					id: z.string().nullable(),
					battletag: z.string()
				})
			})
		),
		socials: z.array(socialSchema)
	}),
	async ({ id, teamId, name, resigned, members, socials }) => {
		await roleGuard(AuthRole.ADMIN);

		const newSlug = toSlug(name);

		await db.transaction(async (tx) => {
			await Promise.all([
				updateInfo(tx, id, name, newSlug, resigned),
				updateMembers(tx, id, members),
				updateSocials(tx, teamId, socials)
			]);
		});

		return { slug: newSlug };
	}
);

async function updateInfo(
	tx: Transaction,
	rosterId: string,
	name: string,
	slug: string,
	resigned: boolean
) {
	await tx
		.update(schema.roster)
		.set({
			name,
			slug,
			resigned
		})
		.where(eq(schema.roster.id, rosterId));
}

async function updateMembers(tx: Transaction, rosterId: string, members: Member[]) {
	// delete all the members and insert them again
	// there is probably a more effective way to do this
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

		const converted = await sharp(file).webp({ lossless: true }).toBuffer();
		const key = s3RosterLogoKey(rosterId);

		const command = new PutObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
			Body: converted,
			ContentType: `image/webp`
		});

		await S3.send(command);
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
