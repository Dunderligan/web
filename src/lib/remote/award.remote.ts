import { command } from '$app/server';
import { AuthRole } from '$lib/authRole';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import sharp from 'sharp';
import { cdnImageSrc, s3AwardTypeImageKey } from '$lib/util';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3_BUCKET_NAME } from '$env/static/private';
import S3 from '$lib/server/s3';

export const createAwardType = command(
	z.object({
		name: z.string().min(1),
		showDivision: z.boolean()
	}),
	async ({ name, showDivision }) => {
		await roleGuard(AuthRole.ADMIN);

		const [awardType] = await db
			.insert(schema.awardType)
			.values({
				name,
				showDivision
			})
			.returning();

		return { awardType };
	}
);

export const updateAwardType = command(
	z.object({
		id: z.uuid(),
		name: z.string().min(1),
		showDivision: z.boolean()
	}),
	async ({ id, name, showDivision }) => {
		await roleGuard(AuthRole.ADMIN);

		const [awardType] = await db
			.update(schema.awardType)
			.set({ name, showDivision })
			.where(eq(schema.awardType.id, id))
			.returning();

		return { awardType };
	}
);

export const uploadAwardTypeImage = command(
	z.object({
		id: z.uuid(),
		image: z.instanceof(ArrayBuffer)
	}),
	async ({ id, image }) => {
		await roleGuard(AuthRole.ADMIN);

		const converted = await sharp(image).webp({ lossless: true }).toBuffer();
		const key = s3AwardTypeImageKey(id);

		const command = new PutObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
			Body: converted,
			ContentType: `image/webp`
		});

		await S3.send(command);

		const imageUrl = cdnImageSrc(`/${key}`, { width: 256 });

		console.log('Uploaded award type image to S3:', imageUrl);

		const [awardType] = await db
			.update(schema.awardType)
			.set({ imageUrl })
			.where(eq(schema.awardType.id, id))
			.returning();

		return { awardType };
	}
);

export const deleteAwardType = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.awardType).where(eq(schema.awardType.id, id));
	}
);

export const createPlayerAward = command(
	z.object({
		awardTypeId: z.uuid(),
		playerId: z.uuid(),
		divisionId: z.uuid().nullable(),
		description: z.string().nullable()
	}),
	async (data) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.insert(schema.playerAward).values(data);
	}
);

export const updatePlayerAward = command(
	z.object({
		id: z.uuid(),
		description: z.string().nullable()
	}),
	async ({ id, description }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.update(schema.playerAward).set({ description }).where(eq(schema.playerAward.id, id));
	}
);

export const deletePlayerAward = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.delete(schema.playerAward).where(eq(schema.playerAward.id, id));
	}
);
