import { command, getRequestEvent, query } from '$app/server';
import { AuthRole, isAdmin } from '$lib/auth-role';
import { memberSchema, teamSubmissionSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import type { User } from '$lib/server/db/schema/auth';
import { SubmissionStatus, type TeamSubmission } from '$lib/types';
import { createRoster, editRoster } from './roster.remote';
import s3 from '$lib/server/s3';
import cdn from '$lib/cdn';
import image from '$lib/server/image';
import submissionExport from '$lib/server/submission-export';
import { entityQuery } from '$lib/server/db/helpers';

export const updateRegistration = command(
	z.object({
		id: z.uuid(),
		openDate: z.date(),
		closeDate: z.date(),
		minPlayers: z.number().int().min(1),
		maxPlayers: z.number().int().min(1)
	}),
	async ({ id, ...data }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.update(schema.registration).set(data).where(eq(schema.registration.id, id));
	}
);

export const deleteRegistration = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.registration).where(eq(schema.registration.id, id));
	}
);

export const submitTeam = command(
	z.object({
		registrationId: z.uuid(),
		logo: z.instanceof(ArrayBuffer),
		data: teamSubmissionSchema
	}),
	async ({ registrationId, logo, data }) => {
		const { locals } = getRequestEvent();

		const registration = await db.query.registration.findFirst({
			where: { id: registrationId },
			columns: { closeDate: true }
		});

		if (registration && registration.closeDate < new Date()) {
			throw error(400, 'This registration is closed and cannot be submitted to');
		}

		const [submission] = await db
			.insert(schema.teamSubmission)
			.values({
				name: data.name,
				registrationId,
				submittedById: locals.user?.id,
				data
			})
			.returning({ id: schema.teamSubmission.id });

		await processAndUploadLogo(submission.id, logo);

		return { submission };
	}
);

async function validateUserAccess(submissionId: string): Promise<User> {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw error(401, 'You must be logged in to access this submission');
	}

	const submission = await db.query.teamSubmission.findFirst({
		where: { id: submissionId },
		columns: { submittedById: true },
		with: {
			registration: {
				columns: { closeDate: true }
			}
		}
	});

	if (!submission) {
		throw error(404, 'Team submission not found');
	}

	if (submission.submittedById !== locals.user.id && !isAdmin(locals.user.role)) {
		throw error(403, 'You do not have permission to access this submission');
	}

	if (submission.registration.closeDate < new Date() && !isAdmin(locals.user.role)) {
		throw error(403, 'This registration is closed and cannot be edited');
	}

	return locals.user;
}

export const editTeamSubmissionData = command(
	z.object({
		id: z.uuid(),
		data: teamSubmissionSchema
	}),
	async ({ id, data }) => {
		const user = await validateUserAccess(id);

		await db
			.update(schema.teamSubmission)
			.set({
				name: data.name,
				data,
				editedAt: new Date(),
				// If the user is not an admin, request a re-review of the submission
				status: !isAdmin(user.role) ? SubmissionStatus.PENDING : undefined
			})
			.where(eq(schema.teamSubmission.id, id));
	}
);

export const editTeamSubmissionLogo = command(
	z.object({
		id: z.uuid(),
		logo: z.instanceof(ArrayBuffer)
	}),
	async ({ id, logo }) => {
		await validateUserAccess(id);

		await processAndUploadLogo(id, logo);
	}
);

export const deleteTeamSubmission = command(z.object({ id: z.uuid() }), async ({ id }) => {
	await validateUserAccess(id);

	const [deletedSubmission] = await db
		.delete(schema.teamSubmission)
		.where(eq(schema.teamSubmission.id, id))
		.returning({ approvedRosterId: schema.teamSubmission.approvedRosterId });

	if (deletedSubmission?.approvedRosterId) {
		// If the submission was approved at least once and earned a roster, delete it as well
		await db.delete(schema.roster).where(eq(schema.roster.id, deletedSubmission.approvedRosterId));
	}
});

export const reviewTeamSubmission = command(
	z.object({
		submissionId: z.uuid(),
		// The group to place the roster into, if the submission is approved.
		// This is required when approving a submission for the first time.
		groupId: z.uuid().optional(),
		approve: z.boolean()
	}),
	async ({ submissionId, groupId, approve }) => {
		const user = await roleGuard(AuthRole.ADMIN);

		const submission = await db.query.teamSubmission.findFirst({
			where: { id: submissionId }
		});

		if (!submission) {
			throw error(404, 'Team submission not found');
		}

		if (submission?.status !== 'pending') {
			throw error(400, 'Submission has already been reviewed');
		}

		if (!approve) {
			// Reject the submission immediately. If the submission was approved before being edited and now rejected,
			// we **don't** revert the roster creation. Instead, we leave the roster as is (and still open for edits).
			await applyReview(submissionId, SubmissionStatus.REJECTED, user);
			return;
		}

		// TODO: send some notification to the submitter?

		const data = teamSubmissionSchema.parse(submission.data);

		let rosterId = submission.approvedRosterId;
		if (!rosterId) {
			if (!groupId) {
				throw error(
					400,
					'Group ID must be provided when approving a submission for the first time'
				);
			}

			// This submission has not been approved before, create its roster.
			const { roster } = await createRoster({
				groupId,
				name: submission.name
			});

			rosterId = roster.id;
		}

		await editRoster({
			id: rosterId,
			name: submission.name,
			members: data.members
		});

		await applyReview(submissionId, SubmissionStatus.APPROVED, user, rosterId);

		// Copy the user-uploaded submission logo to the proper roster location.
		// This will overwrite any existing roster logo from a previous approval.
		await s3.copyFile(cdn.submissionLogoKey(submissionId), cdn.rosterLogoKey(rosterId));

		return { roster: { id: rosterId } };
	}
);

export const exportTeamSubmissionCsv = query(
	z.object({
		registrationId: z.uuid()
	}),
	async ({ registrationId }) => {
		await roleGuard(AuthRole.ADMIN);

		const registration = await db.query.registration.findFirst({
			where: { id: registrationId },
			columns: {},
			with: {
				submissions: true,
				season: entityQuery
			}
		});

		if (!registration) {
			throw error(404, 'Team submission not found');
		}

		const teams: TeamSubmission[] = registration.submissions.map(({ data, ...info }) => {
			return {
				info,
				data: teamSubmissionSchema.parse(data)
			};
		});

		return {
			season: registration.season,
			content: submissionExport.exportTeamSubmission(teams)
		};
	}
);

async function applyReview(
	submissionId: string,
	status: SubmissionStatus,
	user: User,
	approvedRosterId?: string
) {
	await db
		.update(schema.teamSubmission)
		.set({
			status,
			reviewedAt: new Date(),
			reviewedById: user.id,
			approvedRosterId
		})
		.where(eq(schema.teamSubmission.id, submissionId));
}

async function processAndUploadLogo(submissionId: string, logo: ArrayBuffer) {
	let buffer = await image.trim(Buffer.from(logo));
	buffer = await image.convertToWebp(buffer);

	await s3.uploadImage(buffer, cdn.submissionLogoKey(submissionId));
}
