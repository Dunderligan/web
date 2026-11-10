import { PickBanMapType, WinCondition } from './types';

/** A fully resolved configuration, with every setting set to a concrete value. */
export type ResolvedPickBanConfig = {
	enabled: boolean;
	decisionTimeoutSeconds: number;
	allowConcedeFirstBan: boolean;

	winCondition: WinCondition;
	mapCount: number;

	mapType: PickBanMapType;

	/** Restrict available maps. `null` means no restriction. */
	allowedMapIds: string[] | null;
	/** Restrict available gamemodes. `null` means no restriction. */
	allowedGamemodeIds: string[] | null;
	/** Whether to restrict gamemodes so previously picked ones cannot be chosen again. */
	restrictUsedGamemodes: boolean;
	/** Restrict the first gamemode to a specific one. */
	firstGamemodeId: string | null;

	/** A sequence of map ids to play in case mapType is FIXED. */
	fixedMapIds: string[] | null;
};

/**
 * A configuration row as stored for a scope. This struct must be kept flat
 * in order to be stored in a single database row.
 *
 * The `set*` flags and their corresponding properties indicate whether the value is explicitly set in the row.
 * If not, the value is inherited from less specific scopes, falling back up to the global default.
 *
 * The remaining properties are nullable, where a null value means inherit.
 */
export type PickBanConfigValues = {
	enabled: boolean | null;
	decisionTimeoutSeconds: number | null;
	allowConcedeFirstBan: boolean | null;

	winCondition: WinCondition | null;
	mapCount: number | null;

	mapType: PickBanMapType | null;

	setAllowedMapIds: boolean;
	allowedMapIds: string[] | null;

	setAllowedGamemodeIds: boolean;
	allowedGamemodeIds: string[] | null;

	setFirstGamemodeId: boolean;
	firstGamemodeId: string | null;

	restrictUsedGamemodes: boolean | null;

	fixedMapIds: string[] | null;
};

/** The dimensions of a match used to select config scopes. */
export type MatchScope = {
	divisionId: string | null;
	bracketId: string | null;
	round: number | null;
};

export type PickBanConfigRow = PickBanConfigValues & MatchScope;

/** Thrown when a configuration cannot produce a coherent effective configuration. */
export class InvalidPickBanConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidPickBanConfigError';
	}
}

/**
 * Documented defaults. Pick and ban is disabled unless a scope enables it; the timeout is
 * 60 seconds; bans and picks fall back to a random eligible option; conceding the first ban
 * is allowed; and no map or gamemode restrictions apply.
 */
export const DEFAULT_PICK_BAN_CONFIG: ResolvedPickBanConfig = {
	enabled: false,
	decisionTimeoutSeconds: 60,
	allowConcedeFirstBan: true,
	winCondition: WinCondition.FIRST_TO,
	mapCount: 3,
	mapType: PickBanMapType.POOL,
	allowedMapIds: null,
	allowedGamemodeIds: null,
	restrictUsedGamemodes: false,
	firstGamemodeId: null,
	fixedMapIds: null
};

/**
 * Resolves the effective configuration for a match.
 *
 * Scope precedence, most specific first:
 * 1. bracket + round
 * 2. bracket
 * 3. division + round
 * 4. division
 * 5. global
 */
export function resolveConfig(scope: MatchScope, rows: PickBanConfigRow[]): ResolvedPickBanConfig {
	const appliedRows = rows
		.filter((row) => scopeMatches(scope, row))
		.map((row) => ({ row, rank: scopeRank(row) }))
		.sort((a, b) => b.rank - a.rank); // least specific first

	let resolved = DEFAULT_PICK_BAN_CONFIG;

	// apply each row in order, overriding any values that are set
	for (const { row } of appliedRows) {
		resolved = applyValues(resolved, row);
	}

	validateConfig(resolved);
	return resolved;
}

/** Validates a resolved configuration, throwing on values that cannot be used. */
export function validateConfig(config: ResolvedPickBanConfig): void {
	if (!Number.isInteger(config.mapCount) || config.mapCount < 1) {
		throw new InvalidPickBanConfigError('mapCount must be a positive integer');
	}

	if (!Number.isInteger(config.decisionTimeoutSeconds) || config.decisionTimeoutSeconds < 1) {
		throw new InvalidPickBanConfigError('decisionTimeoutSeconds must be a positive integer');
	}

	if (config.allowedMapIds) {
		if (config.allowedMapIds.length === 0) {
			throw new InvalidPickBanConfigError('allowedMapIds cannot be empty when defined');
		}
		if (new Set(config.allowedMapIds).size !== config.allowedMapIds.length) {
			throw new InvalidPickBanConfigError('allowedMapIds contains duplicate maps');
		}
	}

	if (config.allowedGamemodeIds) {
		if (config.allowedGamemodeIds.length === 0) {
			throw new InvalidPickBanConfigError('allowedGamemodeIds cannot be empty when defined');
		}
		if (new Set(config.allowedGamemodeIds).size !== config.allowedGamemodeIds.length) {
			throw new InvalidPickBanConfigError('allowedGamemodeIds contains duplicate gamemodes');
		}
	}

	if (config.mapType === PickBanMapType.FIXED) {
		if (!config.fixedMapIds || config.fixedMapIds.length === 0) {
			throw new InvalidPickBanConfigError('fixedMapIds is required when mapType is FIXED');
		}
		if (new Set(config.fixedMapIds).size !== config.fixedMapIds.length) {
			throw new InvalidPickBanConfigError('fixedMapIds contains duplicate maps');
		}
		if (config.fixedMapIds.length < config.mapCount) {
			throw new InvalidPickBanConfigError('fixedMapIds must contain at least mapCount maps');
		}
	}
}

/**
 * Whether a configuration row matches a given match scope.
 * All defined scope dimensions must equal the match's value for the row to apply.
 */
function scopeMatches(scope: MatchScope, row: PickBanConfigRow): boolean {
	if (row.divisionId !== null && row.divisionId !== scope.divisionId) return false;
	if (row.bracketId !== null && row.bracketId !== scope.bracketId) return false;
	if (row.round !== null && row.round !== scope.round) return false;
	return true;
}

/** Lower numbers are more specific. */
function scopeRank(row: PickBanConfigRow): number {
	const hasDivision = row.divisionId !== null;
	const hasBracket = row.bracketId !== null;
	const hasRound = row.round !== null;

	if (hasBracket && hasRound) return 1;
	if (hasBracket) return 2;

	if (hasDivision && hasRound) return 3;
	if (hasDivision) return 4;

	return 5;
}

function applyValues(base: ResolvedPickBanConfig, row: PickBanConfigValues): ResolvedPickBanConfig {
	const next = { ...base };

	if (row.enabled !== null) next.enabled = row.enabled;
	if (row.decisionTimeoutSeconds !== null) next.decisionTimeoutSeconds = row.decisionTimeoutSeconds;
	if (row.allowConcedeFirstBan !== null) next.allowConcedeFirstBan = row.allowConcedeFirstBan;

	if (row.winCondition !== null) next.winCondition = row.winCondition;
	if (row.mapCount !== null) next.mapCount = row.mapCount;

	if (row.mapType !== null) next.mapType = row.mapType;

	if (row.setAllowedMapIds) next.allowedMapIds = row.allowedMapIds;
	if (row.setAllowedGamemodeIds) next.allowedGamemodeIds = row.allowedGamemodeIds;
	if (row.setFirstGamemodeId) next.firstGamemodeId = row.firstGamemodeId;

	if (row.restrictUsedGamemodes !== null) next.restrictUsedGamemodes = row.restrictUsedGamemodes;

	if (row.fixedMapIds !== null) next.fixedMapIds = row.fixedMapIds;

	return next;
}
