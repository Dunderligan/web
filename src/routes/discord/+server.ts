import { socials } from '$lib/socials';
import { redirect } from '@sveltejs/kit';

export const GET = async () => {
	redirect(303, socials.discord);
};
