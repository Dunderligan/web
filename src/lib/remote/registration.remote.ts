import { command, getRequestEvent } from '$app/server';
import { AuthRole, isAdmin } from '$lib/authRole';
import { memberSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import type { User } from '$lib/server/db/schema/auth';
import { SubmissionStatus } from '$lib/types';
import { createRoster, editRoster } from './roster.remote';

export const updateRegistration = command(
	z.object({
		id: z.uuid(),
		openDate: z.date(),
		closeDate: z.date()
	}),
	async ({ id, openDate, closeDate }) => {
		await roleGuard(AuthRole.ADMIN);

		await db
			.update(schema.registration)
			.set({ openDate, closeDate })
			.where(eq(schema.registration.id, id));
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

const submissionSchema = z.object({
	name: z.string().min(1).max(100),
	members: z.array(memberSchema)
});

export const submitTeam = command(
	z.object({
		registrationId: z.uuid(),
		data: submissionSchema
	}),
	async ({ registrationId, data }) => {
		const { locals } = getRequestEvent();

		const [submission] = await db
			.insert(schema.teamSubmission)
			.values({
				name: data.name,
				registrationId,
				submittedById: locals.user?.id,
				data
			})
			.returning({ id: schema.teamSubmission.id });

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
		columns: { submittedById: true }
	});

	if (!submission) {
		throw error(404, 'Team submission not found');
	}

	if (submission.submittedById !== locals.user.id && !isAdmin(locals.user.role)) {
		throw error(403, 'You do not have permission to access this submission');
	}

	return locals.user;
}

export const editTeamSubmission = command(
	z.object({
		submissionId: z.uuid(),
		data: submissionSchema
	}),
	async ({ submissionId, data }) => {
		const user = await validateUserAccess(submissionId);

		await db
			.update(schema.teamSubmission)
			.set({
				name: data.name,
				data: { members: data.members },
				editedAt: new Date(),
				// If the user is not an admin, request a re-review of the submission
				status: !isAdmin(user.role) ? SubmissionStatus.PENDING : undefined
			})
			.where(eq(schema.teamSubmission.id, submissionId));
	}
);

export const deleteTeamSubmission = command(
	z.object({ submissionId: z.uuid() }),
	async ({ submissionId }) => {
		await validateUserAccess(submissionId);

		await db.delete(schema.teamSubmission).where(eq(schema.teamSubmission.id, submissionId));
	}
);

export const reviewTeamSubmission = command(
	z.object({
		submissionId: z.uuid(),
		// The group to place the roster into, if the submission is approved.
		// This is ignored if approve is set to false.
		groupId: z.uuid(),
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
			await applyReview(submissionId, false, user);
			return;
		}

		// TODO: send some notification to the submitter?

		const data = submissionSchema.parse(submission.data);

		let rosterId = submission.approvedRosterId;
		if (!rosterId) {
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

		await applyReview(submissionId, true, user);

		return { roster: { id: rosterId } };
	}
);

async function applyReview(submissionId: string, approve: boolean, user: User) {
	await db
		.update(schema.teamSubmission)
		.set({
			status: approve ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED,
			reviewedAt: new Date(),
			reviewedById: user.id
		})
		.where(eq(schema.teamSubmission.id, submissionId));
}
