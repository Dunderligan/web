import { db, schema } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';

export const load = async ({ params }) => {
	// redirect to the latest roster with the same slug
	// we can't use relational queries here because drizzle doesn't support orderBy in related tables yet
	const [latest] = await db
		.select({ seasonSlug: schema.season.slug })
		.from(schema.roster)
		.innerJoin(schema.group, eq(schema.roster.groupId, schema.group.id))
		.innerJoin(schema.division, eq(schema.group.divisionId, schema.division.id))
		.innerJoin(schema.season, eq(schema.division.seasonId, schema.season.id))
		.where(eq(schema.roster.slug, params.roster))
		.orderBy(desc(schema.season.startedAt))
		.limit(1);

	if (!latest) {
		error(404);
	}

	redirect(303, `/lag/${params.roster}/${latest.seasonSlug}`);
};
