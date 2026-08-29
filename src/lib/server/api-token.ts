import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db, schema } from './db';
import { and, eq } from 'drizzle-orm';

function hashToken(key: string) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(key)));
}

async function createKey(name: string, userId: string) {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	const tokenHash = hashToken(token);

	const [key] = await db
		.insert(schema.apiKey)
		.values({
			userId,
			tokenHash,
			name
		})
		.returning();

	return { key, token };
}

async function deleteKey(id: string, userId: string) {
	await db
		.delete(schema.apiKey)
		.where(and(eq(schema.apiKey.id, id), eq(schema.apiKey.userId, userId)));
}

async function validateToken(token: string) {
	const tokenHash = hashToken(token);

	const [result] = await db
		.select({
			user: schema.user,
			key: schema.apiKey
		})
		.from(schema.apiKey)
		.innerJoin(schema.user, eq(schema.apiKey.userId, schema.user.id))
		.where(eq(schema.apiKey.tokenHash, tokenHash));

	if (!result) {
		return { key: null, user: null };
	}

	await db
		.update(schema.apiKey)
		.set({ lastUsedAt: new Date() })
		.where(eq(schema.apiKey.id, result.key.id));

	return result;
}

export default { createKey, deleteKey, validateToken };
