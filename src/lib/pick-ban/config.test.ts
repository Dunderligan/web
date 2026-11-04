import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PICK_BAN_CONFIG,
	InvalidPickBanConfigError,
	resolveConfig,
	validateConfig,
	type MatchScope,
	type PickBanConfigRow
} from './config';
import { PickBanMapType, WinCondition } from './types';
import { MAP } from './test-helpers';

function row(partial: Partial<PickBanConfigRow> = {}): PickBanConfigRow {
	return {
		divisionId: null,
		bracketId: null,
		round: null,
		enabled: null,
		decisionTimeoutSeconds: null,
		allowConcedeFirstBan: null,
		winCondition: null,
		mapCount: null,
		mapType: null,
		setAllowedMapIds: false,
		allowedMapIds: null,
		setAllowedGamemodeIds: false,
		allowedGamemodeIds: null,
		setFirstGamemodeId: false,
		firstGamemodeId: null,
		restrictUsedGamemodes: null,
		fixedMapIds: null,
		...partial
	};
}

const globalScope: MatchScope = { divisionId: null, bracketId: null, round: null };
const groupScope: MatchScope = { divisionId: 'division-1', bracketId: null, round: 2 };
const bracketScope: MatchScope = { divisionId: 'division-1', bracketId: 'bracket-1', round: 2 };

describe('resolveConfig', () => {
	it('returns the documented defaults without any rows', () => {
		expect(resolveConfig(globalScope, [])).toEqual(DEFAULT_PICK_BAN_CONFIG);
		expect(DEFAULT_PICK_BAN_CONFIG.enabled).toBe(false);
		expect(DEFAULT_PICK_BAN_CONFIG.decisionTimeoutSeconds).toBe(60);
		expect(DEFAULT_PICK_BAN_CONFIG.winCondition).toBe(WinCondition.FIRST_TO);
		expect(DEFAULT_PICK_BAN_CONFIG.mapCount).toBe(3);
		expect(DEFAULT_PICK_BAN_CONFIG.allowConcedeFirstBan).toBe(true);
		expect(DEFAULT_PICK_BAN_CONFIG.mapType).toBe(PickBanMapType.POOL);
	});

	it('merges options from different scopes', () => {
		const config = resolveConfig(groupScope, [
			row({ enabled: true }),
			row({ divisionId: 'division-1', decisionTimeoutSeconds: 30 }),
			row({ divisionId: 'division-1', mapCount: 5, winCondition: WinCondition.FIXED_MAPS })
		]);

		expect(config.enabled).toBe(true);
		expect(config.decisionTimeoutSeconds).toBe(30);
		expect(config.mapCount).toBe(5);
		expect(config.winCondition).toBe(WinCondition.FIXED_MAPS);
	});

	it('uses the most specific applicable scope per option', () => {
		const config = resolveConfig(bracketScope, [
			row({ decisionTimeoutSeconds: 10 }),
			row({ divisionId: 'division-1', decisionTimeoutSeconds: 20 }),
			row({ divisionId: 'division-1', round: 2, decisionTimeoutSeconds: 30 }),
			row({ bracketId: 'bracket-1', decisionTimeoutSeconds: 40 }),
			row({ bracketId: 'bracket-1', round: 2, decisionTimeoutSeconds: 50 })
		]);

		expect(config.decisionTimeoutSeconds).toBe(50);
	});

	it('prefers a bracket default over a division round', () => {
		const config = resolveConfig(bracketScope, [
			row({ divisionId: 'division-1', round: 2, decisionTimeoutSeconds: 30 }),
			row({ bracketId: 'bracket-1', decisionTimeoutSeconds: 40 })
		]);

		expect(config.decisionTimeoutSeconds).toBe(40);
	});

	it('prefers a division round over a division default for group matches', () => {
		const config = resolveConfig({ ...groupScope, round: 3 }, [
			row({ divisionId: 'division-1', decisionTimeoutSeconds: 20 }),
			row({ divisionId: 'division-1', round: 3, decisionTimeoutSeconds: 35 })
		]);

		expect(config.decisionTimeoutSeconds).toBe(35);
	});

	it('ignores rows for other divisions, brackets and rounds', () => {
		const config = resolveConfig(bracketScope, [
			row({ divisionId: 'division-2', decisionTimeoutSeconds: 5 }),
			row({ bracketId: 'bracket-2', decisionTimeoutSeconds: 6 }),
			row({ bracketId: 'bracket-1', round: 1, decisionTimeoutSeconds: 7 })
		]);

		expect(config.decisionTimeoutSeconds).toBe(60);
	});

	it('does not apply bracket rows or round rows to group matches without a round', () => {
		const config = resolveConfig(groupScope, [
			row({ bracketId: 'bracket-1', decisionTimeoutSeconds: 5 }),
			row({ round: 2, decisionTimeoutSeconds: 6 }),
			row({ divisionId: 'division-1', decisionTimeoutSeconds: 25 })
		]);

		expect(config.decisionTimeoutSeconds).toBe(25);
	});

	it('inherits a list when the child only overrides the list', () => {
		const config = resolveConfig(groupScope, [
			row({
				divisionId: 'division-1',
				setAllowedMapIds: true,
				allowedMapIds: [MAP.antarctic, MAP.busan]
			}),
			row({ divisionId: 'division-1', setAllowedMapIds: true, allowedMapIds: [MAP.dorado] })
		]);

		expect(config.allowedMapIds).toEqual([MAP.dorado]);
	});

	it('inherits and overrides a gamemode subset', () => {
		const config = resolveConfig(groupScope, [
			row({
				setAllowedGamemodeIds: true,
				allowedGamemodeIds: ['control', 'escort']
			}),
			row({ divisionId: 'division-1', setAllowedGamemodeIds: true, allowedGamemodeIds: ['hybrid'] })
		]);

		expect(config.allowedGamemodeIds).toEqual(['hybrid']);
	});

	it('can switch off a parent gamemode restriction', () => {
		const config = resolveConfig(groupScope, [
			row({ setAllowedGamemodeIds: true, allowedGamemodeIds: ['control'] }),
			row({ divisionId: 'division-1', setAllowedGamemodeIds: true, allowedGamemodeIds: null })
		]);

		expect(config.allowedGamemodeIds).toBeNull();
	});

	it('can switch off a parent map restriction', () => {
		const config = resolveConfig(groupScope, [
			row({
				setAllowedMapIds: true,
				allowedMapIds: [MAP.antarctic]
			}),
			row({ divisionId: 'division-1', setAllowedMapIds: true, allowedMapIds: null })
		]);

		expect(config.allowedMapIds).toBeNull();
	});

	it('can switch off an inherited first gamemode', () => {
		const config = resolveConfig(groupScope, [
			row({ setFirstGamemodeId: true, firstGamemodeId: 'control' }),
			row({ divisionId: 'division-1', setFirstGamemodeId: true, firstGamemodeId: null })
		]);

		expect(config.firstGamemodeId).toBeNull();
	});

	it('can switch off an inherited fixed map pool', () => {
		const config = resolveConfig(groupScope, [
			row({ mapType: PickBanMapType.FIXED, fixedMapIds: [MAP.antarctic, MAP.busan, MAP.dorado] }),
			row({ divisionId: 'division-1', mapType: PickBanMapType.POOL })
		]);

		expect(config.mapType).toBe(PickBanMapType.POOL);
	});

	it('keeps a child-set fixed map list when only the list changes', () => {
		const config = resolveConfig(groupScope, [
			row({ mapType: PickBanMapType.FIXED, fixedMapIds: [MAP.antarctic, MAP.busan, MAP.dorado] }),
			row({
				divisionId: 'division-1',
				fixedMapIds: [MAP.dorado, MAP.rialto, MAP.midtown]
			})
		]);

		expect(config.mapType).toBe(PickBanMapType.FIXED);
		expect(config.fixedMapIds).toEqual([MAP.dorado, MAP.rialto, MAP.midtown]);
	});
});

describe('validateConfig', () => {
	it('accepts default config', () => {
		expect(() => validateConfig(DEFAULT_PICK_BAN_CONFIG)).not.toThrow();
	});

	it('rejects a non-positive map count', () => {
		expect(() => validateConfig({ ...DEFAULT_PICK_BAN_CONFIG, mapCount: 0 })).toThrow(
			InvalidPickBanConfigError
		);
	});

	it('rejects a non-positive timeout', () => {
		expect(() => validateConfig({ ...DEFAULT_PICK_BAN_CONFIG, decisionTimeoutSeconds: 0 })).toThrow(
			InvalidPickBanConfigError
		);
	});

	it('rejects an empty restricted allowed-map list', () => {
		expect(() => validateConfig({ ...DEFAULT_PICK_BAN_CONFIG, allowedMapIds: [] })).toThrow(
			InvalidPickBanConfigError
		);
	});

	it('rejects an empty restricted gamemode list', () => {
		expect(() => validateConfig({ ...DEFAULT_PICK_BAN_CONFIG, allowedGamemodeIds: [] })).toThrow(
			InvalidPickBanConfigError
		);
	});

	it('rejects duplicate allowed gamemodes', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				allowedGamemodeIds: ['gamemode-control', 'gamemode-control']
			})
		).toThrow(InvalidPickBanConfigError);
	});

	it('rejects duplicate allowed maps', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				allowedMapIds: [MAP.antarctic, MAP.antarctic]
			})
		).toThrow(InvalidPickBanConfigError);
	});

	it('rejects a fixed map pool without maps', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				mapType: PickBanMapType.FIXED,
				fixedMapIds: null
			})
		).toThrow(InvalidPickBanConfigError);
		expect(() =>
			validateConfig({ ...DEFAULT_PICK_BAN_CONFIG, mapType: PickBanMapType.FIXED, fixedMapIds: [] })
		).toThrow(InvalidPickBanConfigError);
	});

	it('rejects a fixed map pool with duplicates', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				mapType: PickBanMapType.FIXED,
				fixedMapIds: [MAP.antarctic, MAP.antarctic, MAP.busan]
			})
		).toThrow(InvalidPickBanConfigError);
	});

	it('rejects a fixed map pool shorter than the match', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				mapType: PickBanMapType.FIXED,
				fixedMapIds: [MAP.antarctic, MAP.busan]
			})
		).toThrow(InvalidPickBanConfigError);
	});

	it('allows a fixed map pool of the required length', () => {
		expect(() =>
			validateConfig({
				...DEFAULT_PICK_BAN_CONFIG,
				mapType: PickBanMapType.FIXED,
				fixedMapIds: [MAP.antarctic, MAP.busan, MAP.dorado]
			})
		).not.toThrow();
	});
});
