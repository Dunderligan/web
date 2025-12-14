import { command } from '$app/server';
import { S3_BUCKET_NAME } from '$env/static/private';
import { db, schema } from '$lib/server/db';
import { findOrCreatePlayer, type Transaction } from '$lib/server/db/helpers';
import S3 from '$lib/server/s3';
import { Rank, Role, SocialPlatform, type Member, type TeamSocial } from '$lib/types';
import { cdnRosterLogoPath, cdnSrc, s3RosterLogoKey, toSlug } from '$lib/util';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import z from 'zod';
import { adminGuard } from './auth.remote';
import sharp from 'sharp';
import { error } from '@sveltejs/kit';

/// Create a roster and add it to a group. If an associated teamId is not provided, a new team will be created.
export const createRoster = command(
	z.object({
		groupId: z.uuidv4(),
		seasonSlug: z.string(),
		name: z.string().nonempty(),
		teamId: z.uuidv4().nullish()
	}),
	async ({ groupId, seasonSlug, name, teamId }) => {
		await adminGuard();

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
				seasonSlug,
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
		await adminGuard();

		await db.delete(schema.roster).where(eq(schema.roster.id, id));

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
		members: z.array(
			z.object({
				role: z.enum(Role),
				rank: z.enum(Rank).nullable(),
				tier: z.int().max(5).min(1).nullable(),
				sr: z.int().min(0).nullable(),
				isCaptain: z.boolean(),
				player: z.object({
					id: z.string().nullable(),
					battletag: z.string()
				})
			})
		),
		socials: z.array(
			z.object({
				platform: z.enum(SocialPlatform),
				url: z.url()
			})
		)
	}),
	async ({ id, teamId, name, members, socials }) => {
		await adminGuard();

		const newSlug = toSlug(name);

		await db.transaction(async (tx) => {
			await Promise.all([
				updateName(tx, id, name, newSlug),
				updateMembers(tx, id, members),
				updateSocials(tx, teamId, socials)
			]);
		});

		return { slug: newSlug };
	}
);

async function updateName(tx: Transaction, rosterId: string, name: string, slug: string) {
	await tx
		.update(schema.roster)
		.set({
			name,
			slug
		})
		.where(eq(schema.roster.id, rosterId));
}

async function updateMembers(tx: Transaction, rosterId: string, members: Member[]) {
	// delete all the members and insert them again
	// there is probably a more effective way to do this
	await tx.delete(schema.member).where(eq(schema.member.rosterId, rosterId));

	const memberInserts = await Promise.all(
		members.map(async (member) => {
			// if they already have an associated id, use that
			let playerId = member.player.id ?? (await findOrCreatePlayer(tx, member.player.battletag));

			return {
				playerId,
				rosterId: rosterId,
				role: member.role,
				rank: member.rank,
				tier: member.tier,
				sr: member.sr,
				isCaptain: member.isCaptain
			};
		})
	);

	if (memberInserts.length > 0) {
		await tx.insert(schema.member).values(memberInserts);
	}
}

async function updateSocials(tx: Transaction, teamId: string, socials: TeamSocial[]) {
	if (socials.length === 0) {
		// delete all platforms
		await tx.delete(schema.social).where(eq(schema.social.teamId, teamId));
		return;
	}

	// delete extra platforms
	const platforms = socials.map((social) => social.platform);
	await tx
		.delete(schema.social)
		.where(and(eq(schema.social.teamId, teamId), not(inArray(schema.social.platform, platforms))));

	await tx
		.insert(schema.social)
		.values(
			socials.map((social) => ({
				url: social.url,
				platform: social.platform,
				teamId
			}))
		)
		.onConflictDoUpdate({
			target: [schema.social.teamId, schema.social.platform],
			set: { url: sql.raw(`excluded.${schema.social.url.name}`) }
		});
}

export const uploadRosterLogo = command(
	z.object({
		rosterId: z.uuid(),
		file: z.instanceof(ArrayBuffer)
	}),
	async ({ rosterId, file }) => {
		await adminGuard();

		const converted = await sharp(file).webp({ lossless: true }).toBuffer();
		const key = s3RosterLogoKey(rosterId);

		const command = new PutObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
			Body: converted,
			ContentType: `image/webp`
		});

		await S3.send(command);

		console.log('uploaded team logo at', cdnSrc(cdnRosterLogoPath(rosterId)));
	}
);

export const mergeTeams = command(
	z.object({
		teamAId: z.uuid(),
		teamBId: z.uuid()
	}),
	async ({ teamAId, teamBId }) => {
		await adminGuard();

		// set all rosters in teamB to teamA
		await db
			.update(schema.roster)
			.set({ teamId: teamAId })
			.where(eq(schema.roster.teamId, teamBId));
	}
);
