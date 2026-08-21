import { AuthRole } from '$lib/authRole';
import { roleGuard } from '$lib/remote/auth.remote';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers.js';
import { MatchState } from '$lib/types';
import { error, json, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const GET = async ({ params }) => {
	const match = await db.query.match.findFirst({
		where: {
			id: params.id
		},
		...fullMatchQueryWithContext
	});

	if (!match) {
		error(404);
	}

	return json(match);
};

const updateMatchSchema = matchSchema
	.omit({
		// The match ID is provided in the URL instead, and we don't want clients to update it.
		id: true,
		// matchSchema has default values for these fields,  but for updates we want to keep
		// the current values if not provided. We can't use z.partial({...}) here because default()
		// takes precedence over optional(); we need to recreate the fields instead.
		teamAScore: true,
		teamBScore: true,
		draws: true
	})
	.extend({
		state: z.enum(MatchState).optional(),
		teamAScore: z.int().optional(),
		teamBScore: z.int().optional(),
		draws: z.int().optional()
	});

export const PATCH = async ({ request, params }) => {
	await roleGuard(AuthRole.MODERATOR);

	const body = await request.json();
	const parsedBody = updateMatchSchema.safeParse(body);
	if (!parsedBody.success) {
		throw error(400, 'Invalid request body');
	}

	// drizzle throws an error when set() is called with an empty object
	if (Object.keys(parsedBody.data).length === 0) {
		throw error(400, 'No fields to update');
	}

	const [match] = await db
		.update(schema.match)
		.set(parsedBody.data)
		.where(eq(schema.match.id, params.id))
		.returning({
			id: schema.match.id
		});

	if (!match) {
		throw error(404, 'Match not found');
	}

	throw redirect(303, `/api/match/${match.id}`);
};
