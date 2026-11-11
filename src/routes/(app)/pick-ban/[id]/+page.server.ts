import { db } from '$lib/server/db';
import { fullMatchQueryWithContext, memberQuery, rosterQuery } from '$lib/server/db/helpers.js';
import overwatch from '$lib/server/overwatch.js';
import pickBanService from '$lib/server/pick-ban';
import type { GameProfileEntryWithDate, Member } from '$lib/types.js';
import { error } from '@sveltejs/kit';

const roomRosterQuery = {
	...rosterQuery,
	with: {
		members: {
			...memberQuery,
			with: {
				player: {
					columns: {
						id: true,
						battletag: true,
						overwatchProfileSlug: true
					}
				}
			}
		}
	}
} as const;

export const load = async ({ params }) => {
	const room = await db.query.room.findFirst({
		where: {
			id: params.id
		},
		columns: {},
		with: {
			match: {
				...fullMatchQueryWithContext,
				with: {
					rosterA: roomRosterQuery,
					rosterB: roomRosterQuery
				}
			}
		}
	});

	if (!room) {
		throw error(404, 'Room not found');
	}

	const [teamAMembers, teamBMembers, maps, heroes, config] = await Promise.all([
		resolveMemberProfiles(room.match.rosterA?.members ?? []),
		resolveMemberProfiles(room.match.rosterB?.members ?? []),
		db.query.map.findMany(),
		db.query.hero.findMany(),
		pickBanService.retrieveMatchConfig(room.match)
	]);

	return {
		maps,
		heroes,
		config,
		match: room.match,
		teamAMembers,
		teamBMembers,
		roomId: params.id
	};
};

async function resolveMemberProfiles(
	members: (Member & { player: { overwatchProfileSlug: string | null } })[]
): Promise<{ member: Member; profile: GameProfileEntryWithDate }[]> {
	const resolvedMembers = Promise.all(
		members.map(async (member) => {
			const profile = await overwatch.getProfile(
				member.player.battletag,
				member.player.overwatchProfileSlug
			);

			return { member, profile };
		})
	);

	return resolvedMembers;
}
