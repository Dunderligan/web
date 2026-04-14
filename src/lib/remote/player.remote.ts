import { command, getRequestEvent } from '$app/server';
import { AuthRole, canEditUserPage, isModerator } from '$lib/authRole';
import { socialSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { type Transaction } from '$lib/server/db/helpers';
import overwatch from '$lib/server/overwatch';
import type { Social } from '$lib/types';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';

export const editPlayer = command(
	z.object({
		id: z.uuid(),
		pronouns: z.string().max(20).nullable(),
		description: z.string().max(500).nullable(),
		socials: z.array(socialSchema),
		signatureHeroes: z.array(z.uuid()).max(3),
		aliases: z.array(z.string().max(20)).max(5)
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

/**
 * Allows users to take ownership of player profiles that have been registered without a full tag, but match their own name.
 * */
export const claimPlayer = command(
	z.object({
		battletag: z.string()
	}),
	async ({ battletag }) => {
		const { locals } = getRequestEvent();

		const player = await db.query.player.findFirst({
			where: { battletag }
		});

		if (!player) {
			throw error(404);
		}

		// only profiles without a full battletag can be claimed
		if (player.battletag.includes('#')) {
			throw error(400);
		}

		const name = locals.user?.battletag.split('#')[0];

		if (name !== player.battletag) {
			throw error(403);
		}

		await db
			.update(schema.player)
			.set({ battletag: locals.user!.battletag })
			.where(eq(schema.player.id, player.id));

		return { id: player.id };
	}
);

export const setProfileSlug = command(
	z.object({
		playerId: z.uuid(),
		slug: z.string()
	}),
	async ({ playerId, slug }) => {
		const { locals } = getRequestEvent();

		const player = await db.query.player.findFirst({
			where: { id: playerId }
		});

		if (!player) {
			throw error(404);
		}

		if (!canEditUserPage(locals.user, player.battletag)) {
			throw error(403);
		}

		await db
			.update(schema.player)
			.set({ overwatchProfileSlug: slug })
			.where(eq(schema.player.id, playerId));

		await overwatch.invalidateCache(locals.user!.battletag);
	}
);

export const linkPlayerAlias = command(
	z.object({
		playerId: z.uuid(),
		otherPlayerId: z.uuid()
	}),
	async ({ playerId, otherPlayerId }) => {
		await roleGuard(AuthRole.MODERATOR);

		const otherPlayer = await db.query.player.findFirst({
			where: { id: otherPlayerId }
		});

		if (!otherPlayer) {
			throw error(404);
		}

		await db
			.update(schema.member)
			.set({ playerId, registeredName: otherPlayer.battletag })
			.where(eq(schema.member.playerId, otherPlayerId));

		await db.delete(schema.player).where(eq(schema.player.id, otherPlayerId));
	}
);
