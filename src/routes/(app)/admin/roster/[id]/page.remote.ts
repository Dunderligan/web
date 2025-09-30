import { command, form, getRequestEvent } from '$app/server';
import { S3_BUCKET_NAME } from '$env/static/private';
import { isAdmin } from '$lib/auth-client';
import { db, schema } from '$lib/server/db';
import { nestedGroupQuery as nestedGroupQuery, type Transaction } from '$lib/server/db/helpers';
import { Rank, Role, SocialPlatform, type Member, type TeamSocial } from '$lib/types';
import { flattenGroup, toSlug } from '$lib/util';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import S3 from '$lib/server/s3';
import * as z from 'zod';

export const uploadLogo = form(async (data) => {
	const file = data.get('file') as File;
	if (!file) {
		error(400, 'No file provided');
	}

	const rosterId = data.get('rosterId') as string;
	if (!rosterId) {
		error(400, 'No rosterId provided');
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: `logos/${rosterId}.png`,
		Body: buffer,
		ContentType: `image/png`
	});

	await S3.send(command);

	console.log('uploaded logo');
});

export const editRoster = command(
	z.object({
		id: z.string(),
		teamId: z.string(),
		name: z.string(),
		members: z.array(
			z.object({
				role: z.enum(Role),
				rank: z.enum(Rank),
				tier: z.int().max(5).min(1),
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
		const { locals } = getRequestEvent();

		if (!isAdmin(locals.user)) {
			error(403);
		}

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
				isCaptain: member.isCaptain
			};
		})
	);

	if (memberInserts.length > 0) {
		await tx.insert(schema.member).values(memberInserts);
	}
}

async function findOrCreatePlayer(tx: Transaction, battletag: string) {
	const [existingPlayer] = await tx
		.select()
		.from(schema.player)
		.where(eq(schema.player.battletag, battletag));

	if (existingPlayer) {
		return existingPlayer.id;
	} else {
		const [newPlayer] = await tx.insert(schema.player).values({ battletag }).returning();

		return newPlayer.id;
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

export const createRoster = command(
	z.object({
		name: z.string(),
		teamId: z.uuid(),
		groupId: z.uuid()
	}),
	async ({ name, teamId, groupId }) => {
		const group = await db.query.group.findFirst({
			where: eq(schema.group.id, groupId),
			...nestedGroupQuery.group
		});

		if (!group) {
			error(400);
		}

		const { season } = flattenGroup(group);

		await db.insert(schema.roster).values({
			name,
			slug: toSlug(name),
			teamId,
			groupId,
			seasonSlug: season.slug
		});
	}
);
