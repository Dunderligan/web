import { type RoomMapState, DecisionPoint, type RecordedDecision } from './types';

/** Returns the recorded decision for a point, if any. */
export function decisionAt(map: RoomMapState, point: DecisionPoint): RecordedDecision | undefined {
	return map.decisions.find((decision) => decision.point === point);
}

/** Returns the hero id of a recorded ban decision, if the value is a hero ban. */
export function bannedHeroId(decision: RecordedDecision | undefined): string | null {
	if (!decision || !('heroId' in decision.value)) return null;
	return decision.value.heroId;
}

/** Returns the map id of a recorded map pick, if the value is a map pick. */
export function pickedMapId(decision: RecordedDecision | undefined): string | null {
	if (!decision || !('mapId' in decision.value)) return null;
	return decision.value.mapId;
}

/** Returns whether the first-ban team conceded the first ban on a map. */
export function concededFirstBan(map: RoomMapState): boolean {
	const decision = decisionAt(map, DecisionPoint.BAN_ORDER);
	return Boolean(decision && 'concede' in decision.value && decision.value.concede);
}
