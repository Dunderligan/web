import type { Session, User } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			user: User | null;
			commitHash: string | null;
		}
	}
}

export {};
