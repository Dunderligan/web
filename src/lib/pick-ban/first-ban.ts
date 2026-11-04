import { MatchSlot } from '$lib/types';
import { MapOutcome, type RoomMapState, type SeedPair } from './types';

/**
 * Returns the first-ban team for the first map of a match.
 *
 * Seed 1 is the strongest team, so the lower seed is the team with the higher seed number.
 * When both seeds are equal, slot A is chosen deterministically; seeds are expected to be
 * unique, but a room must never fail for that reason alone.
 *
 * The caller supplies the applicable seeds: `roster.initialSeed` for group matches, and the
 * group-stage placement for bracket matches.
 */
export function firstMapFirstBanTeam(seeds: SeedPair): MatchSlot {
	if (seeds.a === null || seeds.b === null) {
		throw new Error('Both team seeds are required to determine the first-ban team');
	}

	if (seeds.a === seeds.b) return MatchSlot.A;
	return seeds.a > seeds.b ? MatchSlot.A : MatchSlot.B;
}

/**
 * Returns the first-ban team for the map after a completed map.
 * The loser of the previous map bans first; after a draw the previous first-ban team keeps it.
 */
export function nextMapFirstBanTeam(previousMap: RoomMapState): MatchSlot {
	if (!previousMap.result) {
		throw new Error('The previous map has no recorded result');
	}

	if (previousMap.result.outcome === MapOutcome.DRAW) {
		return previousMap.firstBanSlot;
	}

	return previousMap.result.outcome === MapOutcome.TEAM_A ? MatchSlot.B : MatchSlot.A;
}

/**
 * Returns the first-ban team for the next map in a room.
 * `maps` contains the completed maps, and is empty for the first map.
 */
export function firstBanTeam(maps: readonly RoomMapState[], seeds: SeedPair): MatchSlot {
	if (maps.length === 0) return firstMapFirstBanTeam(seeds);
	return nextMapFirstBanTeam(maps[maps.length - 1]);
}
