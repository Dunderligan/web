import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { Rank, Role } from '$lib/util';
import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import * as z from 'zod';

export const editRoster = command(
	z.object({
		id: z.string(),
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
		)
	}),
	async ({ id, name, members }) => {
		console.log({ id, name, members });

		const slug = slugify(name).toLowerCase();

		await db
			.update(schema.roster)
			.set({
				name,
				slug
			})
			.where(eq(schema.roster.id, id));

		await db.delete(schema.member).where(eq(schema.member.rosterId, id));

		const memberInserts = await Promise.all(
			members.map(async (member) => {
				let playerId = member.player.id ?? (await findOrCreatePlayer(member.player.battletag));

				return {
					rosterId: id,
					playerId,
					role: member.role,
					rank: member.rank,
					tier: member.tier,
					isCaptain: member.isCaptain
				};
			})
		);

		if (memberInserts.length > 0) {
			await db.insert(schema.member).values(memberInserts);
		}

		return {
			location: `../${slug}`
		};
	}
);
async function findOrCreatePlayer(battletag: string) {
	const [existingPlayer] = await db
		.select()
		.from(schema.player)
		.where(eq(schema.player.battletag, battletag));

	if (existingPlayer) {
		return existingPlayer.id;
	} else {
		const [newPlayer] = await db.insert(schema.player).values({ battletag }).returning();

		return newPlayer.id;
	}
}
