import { genericOAuthClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import { type User as BetterAuthUser } from 'better-auth';

export const authClient = createAuthClient({
	plugins: [genericOAuthClient()]
});

export type User = BetterAuthUser & { role?: string | null };

export function isAdmin(user?: User | null) {
	return user?.role === 'admin';
}
