import { socials } from '#lib/socials.ts';
import { redirect } from '@sveltejs/kit';

export const GET = async () => {
	redirect(303, socials.discord, { external: true });
};
