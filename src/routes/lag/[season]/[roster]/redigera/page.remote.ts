import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import type { Transaction } from '$lib/server/db/helpers';
import { Rank, Role, SocialPlatform, type Member, type TeamSocial } from '$lib/types';
import { eq, sql } from 'drizzle-orm';
import slugify from 'slugify';
import * as z from 'zod';

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
		const newSlug = slugify(name).toLowerCase();

		await db.transaction(async (tx) => {
			await Promise.all([
				updateName(tx, id, name, newSlug),
				updateMembers(tx, id, members),
				updateSocials(tx, teamId, socials)
			]);
		});

		return {
			location: `../${newSlug}`
		};
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
				rosterId: rosterId,
				playerId,
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
	await tx
		.insert(schema.social)
		.values(socials.map((social) => ({ ...social, teamId })))
		.onConflictDoUpdate({
			target: [schema.social.platform, schema.social.teamId],
			set: { url: sql`excluded.${schema.social.url}` }
		});
}
