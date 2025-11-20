import { db, schema } from '$lib/server/db';
import session from '$lib/server/session.js';
import { fail, redirect } from '@sveltejs/kit';
import { asc, desc, eq, SQL } from 'drizzle-orm';

const getMatches = async ({ played, orderBy }: { played: boolean; orderBy: SQL }) => {
	return await db.query.match.findMany({
		limit: 3,
		orderBy,
		where: eq(schema.match.played, played),
		columns: {
			id: true,
			teamAScore: true,
			teamBScore: true,
			draws: true,
			played: true,
			playedAt: true,
			scheduledAt: true
		},
		with: {
			rosterA: {
				columns: {
					id: true,
					name: true,
					slug: true,
					seasonSlug: true
				}
			},
			rosterB: {
				columns: {
					id: true,
					name: true,
					slug: true,
					seasonSlug: true
				}
			}
		}
	});
};

export const load = async () => {
	return {
		matches: {
			upcoming: getMatches({ played: false, orderBy: asc(schema.match.scheduledAt) }),
			latest: getMatches({ played: true, orderBy: desc(schema.match.playedAt) })
		}
	};
};
