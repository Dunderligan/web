export const load = async ({ locals, cookies }) => {
	const theme = cookies.get('theme') ?? null;

	return {
		user: locals.user,
		theme
	};
};
