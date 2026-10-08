import type { Session, User } from '$lib/server/db/schema/auth';

declare global {
	namespace App {
		// these are set in hooks.server.ts
		interface Locals {
			session: Session | null;
			user: User | null;
		}

		// these are set in the root layout +page.server.ts
		interface PageData {
			user: User | null;
			commitHash: string | null;
		}
	}
}

export {};
