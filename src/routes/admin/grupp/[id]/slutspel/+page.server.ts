import { db, schema } from '$lib/server/db';
import { MatchType } from '$lib/types';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: eq(schema.group.id, params.id),
		columns: {},
		with: {
			matches: {
				where: eq(schema.match.type, MatchType.BRACKET)
			}
		}
	});

	if (!data) {
		error(404);
	}

	const matches = new Map(data.matches.map((match) => [match.id, match]));

	return { matches };
};
