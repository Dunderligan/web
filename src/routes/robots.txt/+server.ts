import { redirect, type RequestHandler } from '@sveltejs/kit';
import robotsTxtDev from '#lib/assets/robots-dev.txt?no-inline';
import robotsTxtProd from '#lib/assets/robots-prod.txt?no-inline';
import { FORBID_CRAWLING } from '$app/env/private';

export const GET: RequestHandler = async () => {
	if (FORBID_CRAWLING === 'true') {
		return redirect(303, robotsTxtDev);
	} else {
		return redirect(303, robotsTxtProd);
	}
};
