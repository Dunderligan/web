import { MatchSlot } from '$lib/types';
import type { ResolvedPickBanConfig } from './config';
import { mapDecisionsComplete } from './decisions';
import {
	MapOutcome,
	RoomMapReportState,
	WinCondition,
	type MapReport,
	type MapResult,
	type RoomMapState
} from './types';

export type MatchProgress = {
	teamAWins: number;
	teamBWins: number;
	draws: number;
	mapsPlayed: number;
	complete: boolean;
	/** The match winner once complete, or null for an unfinished or drawn fixed-map match. */
	winner: MatchSlot | null;
};

export enum ReportError {
	NO_MAP = 'no_map',
	DECISIONS_INCOMPLETE = 'decisions_incomplete',
	RESULT_ALREADY_RECORDED = 'result_already_recorded',
	ALREADY_REPORTED = 'already_reported',
	INVALID_OUTCOME = 'invalid_outcome'
}

export type SubmitReportInput = {
	config: ResolvedPickBanConfig;
	/** All maps in the room, with the current map last. */
	maps: readonly RoomMapState[];
	slot: MatchSlot;
	/** The outcome of the map, as reported by a captain or admin. */
	outcome: MapOutcome;
	submittedById: string | null;
	now: Date;
};

export type SubmitReportResult =
	| { ok: true; map: RoomMapState }
	| { ok: false; error: ReportError };

export type ResolveResultInput = {
	config: ResolvedPickBanConfig;
	maps: readonly RoomMapState[];
	outcome: MapOutcome;
	adminId: string;
	now: Date;
};

export type ResolveResultResult =
	| { ok: true; map: RoomMapState }
	| { ok: false; error: ReportError };

/**
 * Records one captain's independent report for the current map.
 *
 * When both reports agree, the map result is recorded and the map advances.
 * When they disagree, the map is marked disputed and no result is recorded until an admin
 * resolves it. A draw is a valid outcome in both win-condition formats.
 */
export function submitReport(input: SubmitReportInput): SubmitReportResult {
	const currentMap = input.maps[input.maps.length - 1];
	if (!currentMap) return { ok: false, error: ReportError.NO_MAP };

	if (currentMap.result) return { ok: false, error: ReportError.RESULT_ALREADY_RECORDED };

	if (!mapDecisionsComplete(input.config, currentMap)) {
		return { ok: false, error: ReportError.DECISIONS_INCOMPLETE };
	}

	if (currentMap.reports.some((report) => report.slot === input.slot)) {
		return { ok: false, error: ReportError.ALREADY_REPORTED };
	}

	const report: MapReport = {
		slot: input.slot,
		outcome: input.outcome,
		submittedById: input.submittedById,
		submittedAt: input.now
	};

	const reports = [...currentMap.reports, report];
	const other = reports.find((entry) => entry.slot !== input.slot);

	if (!other) {
		return { ok: true, map: { ...currentMap, reports, reportState: RoomMapReportState.PENDING } };
	}

	if (report.outcome !== other.outcome) {
		return { ok: true, map: { ...currentMap, reports, reportState: RoomMapReportState.DISPUTED } };
	}

	// The captains agree on the outcome, resolve and record it automatically.
	const result: MapResult = {
		outcome: report.outcome,
		recordedAt: input.now,
		resolvedById: null
	};

	return {
		ok: true,
		map: { ...currentMap, reports, reportState: RoomMapReportState.AGREED, result }
	};
}

/**
 * Sets the current map's result directly as an admin. This is allowed before either captain
 * has reported, and is also how a disputed map is resolved. The result is marked as resolved
 * by the acting admin.
 */
export function resolveResult(input: ResolveResultInput): ResolveResultResult {
	const map = input.maps[input.maps.length - 1];
	if (!map) return { ok: false, error: ReportError.NO_MAP };

	if (!mapDecisionsComplete(input.config, map)) {
		return { ok: false, error: ReportError.DECISIONS_INCOMPLETE };
	}

	const result: MapResult = {
		outcome: input.outcome,
		recordedAt: input.now,
		resolvedById: input.adminId
	};

	return {
		ok: true,
		map: { ...map, reportState: RoomMapReportState.RESOLVED, result }
	};
}

/**
 * Calculates match progress from recorded map results.
 * In a first-to match, draws are recorded but do not count toward either team's wins.
 * In a fixed-map match, every played map, including a draw, counts toward the map total.
 */
export function matchProgress(
	config: ResolvedPickBanConfig,
	maps: readonly RoomMapState[]
): MatchProgress {
	const results = maps
		.map((map) => map.result)
		.filter((result): result is MapResult => result !== null);

	const teamAWins = results.filter((result) => result.outcome === MapOutcome.TEAM_A).length;
	const teamBWins = results.filter((result) => result.outcome === MapOutcome.TEAM_B).length;
	const draws = results.filter((result) => result.outcome === MapOutcome.DRAW).length;
	const mapsPlayed = results.length;

	if (config.winCondition === WinCondition.FIRST_TO) {
		const complete = teamAWins >= config.mapCount || teamBWins >= config.mapCount;
		const winner =
			teamAWins >= config.mapCount
				? MatchSlot.A
				: teamBWins >= config.mapCount
					? MatchSlot.B
					: null;

		return { teamAWins, teamBWins, draws, mapsPlayed, complete, winner };
	}

	const complete = mapsPlayed >= config.mapCount;
	const winner =
		complete && teamAWins > teamBWins
			? MatchSlot.A
			: complete && teamBWins > teamAWins
				? MatchSlot.B
				: null;

	return { teamAWins, teamBWins, draws, mapsPlayed, complete, winner };
}

/** Whether the room should stop after the recorded maps. */
export function isMatchComplete(
	config: ResolvedPickBanConfig,
	maps: readonly RoomMapState[]
): boolean {
	return matchProgress(config, maps).complete;
}
