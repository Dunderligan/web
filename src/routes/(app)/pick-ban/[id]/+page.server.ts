import { db } from '$lib/server/db';
import {
	fullMatchQueryWithContext,
	memberQuery,
	rosterQuery,
	roomStateQuery
} from '$lib/server/db/helpers.js';
import overwatch from '$lib/server/overwatch.js';
import pickBanService from '$lib/server/pick-ban';
import presenceStore from '$lib/server/presence';
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
	const roomData = await db.query.room.findFirst({
		...roomStateQuery,
		where: {
			id: params.id
		},
		with: {
			...roomStateQuery.with,
			match: {
				...fullMatchQueryWithContext,
				with: {
					rosterA: roomRosterQuery,
					rosterB: roomRosterQuery
				}
			}
		}
	});

	if (!roomData) {
		throw error(404, 'Room not found');
	}

	const { match, ...roomState } = roomData;

	const [teamAMembers, teamBMembers, maps, heroes, gamemodes, config, presence] = await Promise.all(
		[
			resolveMemberProfiles(match.rosterA?.members ?? []),
			resolveMemberProfiles(match.rosterB?.members ?? []),
			db.query.map.findMany(),
			db.query.hero.findMany(),
			db.query.gamemode.findMany(),
			pickBanService.retrieveMatchConfig(match),
			presenceStore.list(params.id)
		]
	);

	return {
		maps,
		heroes,
		gamemodes,
		config,
		match,
		teamAMembers,
		teamBMembers,
		state: { ...roomState, presence },
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
