import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	} else {
		delete event.locals.session;
		delete event.locals.user;
	}

	if (event.url.pathname.startsWith('/admin') && session?.user.role !== 'admin') {
		redirect(303, '/');
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
