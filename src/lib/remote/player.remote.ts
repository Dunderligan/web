import { command, getRequestEvent } from '$app/server';
import { canEditUserPage, isModerator } from '$lib/authRole';
import { socialSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { type Transaction } from '$lib/server/db/helpers';
import type { Social } from '$lib/types';
import { error } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import z from 'zod';

export const editPlayer = command(
	z.object({
		id: z.uuid(),
		pronouns: z.string().max(20).nullable(),
		description: z.string().max(500).nullable(),
		socials: z.array(socialSchema),
		signatureHeroes: z.array(z.uuid()).max(3),
		aliases: z.array(z.string()).max(5)
	}),
	async ({ id, pronouns, description, socials, signatureHeroes, aliases }) => {
		const { locals } = getRequestEvent();

		const player = await db.query.player.findFirst({
			where: {
				id
			}
		});

		if (!player) {
			throw error(404);
		}

		if (!canEditUserPage(locals.user, player.battletag)) {
			throw error(403);
		}

		// only moderators are allowed to edit descriptions
		const checkedDescription = isModerator(locals.user?.role) ? description : undefined;

		await db.transaction(async (tx) => {
			await Promise.all([
				updateInfo(tx, id, pronouns, checkedDescription),
				updateSocials(tx, id, socials),
				updateSignatureHeroes(tx, id, signatureHeroes),
				updateAliases(tx, id, aliases)
			]);
		});
	}
);

async function updateInfo(
	tx: Transaction,
	playerId: string,
	pronouns: string | null,
	description?: string | null
) {
	await tx
		.update(schema.player)
		.set({ pronouns, description })
		.where(eq(schema.player.id, playerId));
}

async function updateSocials(tx: Transaction, playerId: string, socials: Social[]) {
	await tx.delete(schema.playerSocial).where(eq(schema.playerSocial.playerId, playerId));

	const inserts = socials.map(({ platform, url }) => ({
		playerId: playerId,
		platform,
		url
	}));

	if (inserts.length > 0) {
		await tx.insert(schema.playerSocial).values(inserts);
	}
}

async function updateSignatureHeroes(tx: Transaction, playerId: string, heroIds: string[]) {
	await tx.delete(schema.signatureHero).where(eq(schema.signatureHero.playerId, playerId));

	const inserts = heroIds.map((heroId) => ({
		playerId,
		heroId
	}));

	if (inserts.length > 0) {
		await tx.insert(schema.signatureHero).values(inserts);
	}
}

async function updateAliases(tx: Transaction, playerId: string, aliases: string[]) {
	await tx.delete(schema.playerAlias).where(eq(schema.playerAlias.playerId, playerId));

	const inserts = aliases.map((name) => ({
		playerId,
		name
	}));

	if (inserts.length > 0) {
		await tx.insert(schema.playerAlias).values(inserts);
	}
}
