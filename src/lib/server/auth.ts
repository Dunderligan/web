import { db, schema } from './db';
import { eq } from 'drizzle-orm';
import type { User } from './db/schema/auth';

class Auth {
	/** Looks up a user by their battletag. */
	async getUserFromBattletag(battletag: string): Promise<User | null> {
		const results = await db.select().from(schema.user).where(eq(schema.user.battletag, battletag));

		if (!results) return null;
		return results[0];
	}

	/** Creates a new user from their Battle.net account details. */
	async createUser(battlenetId: number, battletag: string): Promise<User> {
		const [user] = await db
			.insert(schema.user)
			.values({
				battletag,
				battlenetId
			})
			.returning();

		return user;
	}

	/** Deletes a user and all of their associated data. */
	async deleteUser(id: string): Promise<void> {
		await db.delete(schema.user).where(eq(schema.user.id, id));
	}
}

const auth = new Auth();

export default auth;
