import type { User } from '$lib/auth-client';
import type { Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			session?: Session;
			user?: User;
		}
		interface PageData {
			user?: User;
		}
	}
}

export {};
