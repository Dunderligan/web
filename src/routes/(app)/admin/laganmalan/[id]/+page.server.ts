import { isModerator } from '$lib/auth-role.js';
import { teamSubmissionSchema } from '$lib/schemas.js';
import { db } from '$lib/server/db';
import { entityQuery } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, depends, locals }) => {
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

	if (!isModerator(locals.user?.role) && locals.user?.id !== submission.submittedById) {
		throw error(403, 'You are not the owner of this submission');
	}

	const parsedData = teamSubmissionSchema.safeParse(submission.data);
	if (!parsedData.success) {
		throw error(500, 'Submission data is invalid');
	}

	return {
		submission: {
			...submission,
			data: parsedData.data
		}
	};
};
