import { db, schema } from './db';
import { eq } from 'drizzle-orm';

async function getUserFromBattletag(battletag: string) {
	const results = await db.select().from(schema.user).where(eq(schema.user.battletag, battletag));

	if (!results) return null;
	return results[0];
}

async function createUser(battlenetId: number, battletag: string) {
	const [{ id }] = await db
		.insert(schema.user)
		.values({
			battletag,
			battlenetId
		})
		.returning({
			id: schema.user.id
		});

	return {
		id,
		battlenetId,
		battletag
	};
}

export default {
	getUserFromBattletag,
	createUser
};
