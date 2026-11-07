import { describe, expect, it } from 'vitest';
import { MatchSlot } from '$lib/types';
import {
	isMatchComplete,
	matchProgress,
	ReportError,
	resolveResult,
	submitReport
} from './results';
import { MapOutcome, RoomMapReportState, WinCondition, type RoomMapState } from './types';
import { completedMap, config, resultedMap } from './test-helpers';

function report(maps: RoomMapState[], slot: MatchSlot, outcome: MapOutcome, cfg = config()) {
	const result = submitReport({
		config: cfg,
		maps,
		slot,
		outcome,
		submittedById: slot === MatchSlot.A ? 'captain-a' : 'captain-b',
		now: new Date(5_000)
	});

	if (!result.ok) return result;
	return { ...result, maps: [...maps.slice(0, -1), result.map] };
}

describe('submitReport', () => {
	it('records the first report without revealing a result', () => {
		const result = report([completedMap()], MatchSlot.A, MapOutcome.TEAM_A);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.maps[0].reports).toHaveLength(1);
		expect(result.maps[0].reportState).toBe(RoomMapReportState.PENDING);
		expect(result.maps[0].result).toBeNull();
	});

	it('records the result when both reports agree', () => {
		const first = report([completedMap()], MatchSlot.A, MapOutcome.TEAM_A);
		expect(first.ok).toBe(true);
		if (!first.ok) return;

		const second = report(first.maps, MatchSlot.B, MapOutcome.TEAM_A);
		expect(second.ok).toBe(true);
		if (!second.ok) return;

		expect(second.maps[0].reportState).toBe(RoomMapReportState.AGREED);
		expect(second.maps[0].result).toEqual({
			outcome: MapOutcome.TEAM_A,
			recordedAt: new Date(5_000),
			resolvedById: null
		});
	});

	it('marks disagreeing reports as disputed and records no result', () => {
		const first = report([completedMap()], MatchSlot.A, MapOutcome.TEAM_A);
		if (!first.ok) throw new Error('first report failed');

		const second = report(first.maps, MatchSlot.B, MapOutcome.TEAM_B);
		if (!second.ok) throw new Error('second report failed');

		expect(second.maps[0].reportState).toBe(RoomMapReportState.DISPUTED);
		expect(second.maps[0].result).toBeNull();
	});

	it('records a draw as a valid outcome', () => {
		const first = report([completedMap()], MatchSlot.A, MapOutcome.DRAW);
		if (!first.ok) throw new Error('first report failed');

		const second = report(first.maps, MatchSlot.B, MapOutcome.DRAW);
		if (!second.ok) throw new Error('second report failed');

		expect(second.maps[0].result?.outcome).toBe(MapOutcome.DRAW);
	});

	it('rejects a report before all decisions are complete', () => {
		const result = report([completedMap({ decisions: [] })], MatchSlot.A, MapOutcome.TEAM_A);

		expect(result).toEqual({ ok: false, error: ReportError.DECISIONS_INCOMPLETE });
	});

	it('rejects a second report from the same captain', () => {
		const first = report([completedMap()], MatchSlot.A, MapOutcome.TEAM_A);
		if (!first.ok) throw new Error('first report failed');

		const second = report(first.maps, MatchSlot.A, MapOutcome.TEAM_A);
		expect(second).toEqual({ ok: false, error: ReportError.ALREADY_REPORTED });
	});

	it('rejects a report once a result exists', () => {
		const map = completedMap({
			result: {
				outcome: MapOutcome.TEAM_A,
				recordedAt: new Date(1_000),
				resolvedById: 'admin'
			}
		});

		const result = report([map], MatchSlot.A, MapOutcome.TEAM_A);
		expect(result).toEqual({ ok: false, error: ReportError.RESULT_ALREADY_RECORDED });
	});
});

describe('resolveResult', () => {
	it('lets an admin set a result before any captain reports', () => {
		const result = resolveResult({
			config: config(),
			maps: [completedMap()],
			outcome: MapOutcome.TEAM_B,
			adminId: 'admin-1',
			now: new Date(7_000)
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.map.reportState).toBe(RoomMapReportState.RESOLVED);
		expect(result.map.result?.resolvedById).toBe('admin-1');
		expect(result.map.result?.recordedAt).toEqual(new Date(7_000));
	});

	it('resolves a disputed map', () => {
		const first = report([completedMap()], MatchSlot.A, MapOutcome.TEAM_A);
		if (!first.ok) throw new Error('first report failed');
		const disputed = report(first.maps, MatchSlot.B, MapOutcome.TEAM_B);
		if (!disputed.ok) throw new Error('second report failed');

		const result = resolveResult({
			config: config(),
			maps: disputed.maps,
			outcome: MapOutcome.DRAW,
			adminId: 'admin-1',
			now: new Date(8_000)
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.map.reportState).toBe(RoomMapReportState.RESOLVED);
		expect(result.map.result?.outcome).toBe(MapOutcome.DRAW);
	});

	it('rejects a result before all decisions are complete', () => {
		const result = resolveResult({
			config: config(),
			maps: [completedMap({ decisions: [] })],
			outcome: MapOutcome.TEAM_A,
			adminId: 'admin-1',
			now: new Date(1_000)
		});

		expect(result).toEqual({ ok: false, error: ReportError.DECISIONS_INCOMPLETE });
	});
});

describe('matchProgress', () => {
	it('does not count draws toward map wins in a first-to match', () => {
		const progress = matchProgress(config(), [
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.DRAW),
			resultedMap(MapOutcome.DRAW),
			resultedMap(MapOutcome.TEAM_A)
		]);

		expect(progress).toEqual({
			teamAWins: 2,
			teamBWins: 0,
			draws: 2,
			mapsPlayed: 4,
			complete: false,
			winner: null
		});
	});

	it('closes a first-to match when a team reaches the required wins', () => {
		const progress = matchProgress(config({ mapCount: 3 }), [
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.DRAW),
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.TEAM_A)
		]);

		expect(progress.complete).toBe(true);
		expect(progress.winner).toBe(MatchSlot.A);
		expect(progress.mapsPlayed).toBe(4);
	});

	it('closes a fixed-match after exactly the configured number of maps', () => {
		const cfg = config({ winCondition: WinCondition.FIXED_MAPS, mapCount: 3 });
		const progress = matchProgress(cfg, [
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.DRAW),
			resultedMap(MapOutcome.DRAW)
		]);

		expect(progress.complete).toBe(true);
		expect(progress.mapsPlayed).toBe(3);
		expect(progress.winner).toBe(MatchSlot.A);
	});

	it('does not close a fixed-match before all maps have been played', () => {
		const cfg = config({ winCondition: WinCondition.FIXED_MAPS, mapCount: 3 });
		const progress = matchProgress(cfg, [
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.TEAM_A)
		]);

		expect(progress.complete).toBe(false);
		expect(progress.winner).toBeNull();
	});

	it('returns no winner for a drawn fixed-match', () => {
		const cfg = config({ winCondition: WinCondition.FIXED_MAPS, mapCount: 3 });
		const progress = matchProgress(cfg, [
			resultedMap(MapOutcome.TEAM_A),
			resultedMap(MapOutcome.TEAM_B),
			resultedMap(MapOutcome.DRAW)
		]);

		expect(progress.complete).toBe(true);
		expect(progress.winner).toBeNull();
	});

	it('counts only recorded maps', () => {
		const progress = matchProgress(config(), [
			resultedMap(MapOutcome.TEAM_A),
			completedMap({ result: null })
		]);

		expect(progress.mapsPlayed).toBe(1);
	});

	it('reports whether the match is complete', () => {
		expect(isMatchComplete(config({ mapCount: 1 }), [resultedMap(MapOutcome.TEAM_A)])).toBe(true);
		expect(isMatchComplete(config({ mapCount: 2 }), [resultedMap(MapOutcome.TEAM_A)])).toBe(false);
	});
});
