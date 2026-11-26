import { SOURCE_COMMIT } from '$app/env/private';
import { preferencesFromCookies } from '#lib/state/preferences.svelte.ts';

export const load = async ({ locals, cookies }) => {
	const preferences = preferencesFromCookies(cookies);

	// SOURCE_COMMIT is set by Coolify to the current git commit hash
	const commitHash = SOURCE_COMMIT ?? null;

	// pass these down from the server so any component can access them
	return {
		user: locals.user,
		commitHash,
		preferences
	};
};
