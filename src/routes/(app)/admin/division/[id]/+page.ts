import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	redirect(303, `/admin/division/${params.id}/grupper`);
};
