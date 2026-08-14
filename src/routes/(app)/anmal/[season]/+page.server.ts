import { db } from '$lib/server/db.js';
import { entityQuery } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const registration = await db.query.registration.findFirst({
		where: {
			season: {
				slug: params.season
			}
		},
		with: {
			season: {
				columns: {
					legacyRanks: true,
					...entityQuery.columns
				}
			}
		}
	});

	if (!registration) {
		error(404);
	}

	let userSubmissions: { id: string; name: string }[] = [];
	if (locals.user) {
		userSubmissions = await db.query.teamSubmission.findMany({
			where: {
				registrationId: registration.id,
				submittedById: locals.user.id
			},
			columns: {
				id: true,
				name: true
			}
		});
	}

	return {
		registration,
		userSubmissions
	};
};
