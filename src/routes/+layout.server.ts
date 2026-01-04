import { env } from '$env/dynamic/private';

export const load = async ({ locals, cookies }) => {
	const theme = cookies.get('theme') ?? null;

	const commitHash = env.SOURCE_COMMIT ?? null;

	return {
		user: locals.user,
		commitHash,
		theme
	};
};
