import { db } from '$lib/server/db';
import { entityQuery } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, depends }) => {
	depends('admin:submission');

	const submission = await db.query.teamSubmission.findFirst({
		where: { id: params.id },
		with: {
			reviewedBy: {
				columns: {
					battletag: true
				}
			},
			submittedBy: {
				columns: {
					battletag: true
				}
			},
			registration: {
				with: {
					season: {
						columns: {
							legacyRanks: true,
							...entityQuery.columns
						}
					}
				}
			}
		}
	});

	if (!submission) {
		throw error(404, 'Submission not found');
	}

	return {
		submission
	};
};
