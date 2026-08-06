import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw error(401);
	}
};
