import { discordUrl } from '$lib/util';
import { redirect } from '@sveltejs/kit';

export const GET = async () => {
	redirect(303, discordUrl);
};
