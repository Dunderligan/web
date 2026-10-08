import type { UnresolvedMatch, Roster } from '$lib/types';
import { SvelteMap } from 'svelte/reactivity';
import { defineContext } from './util';

const { get, set } = defineContext<RosterContext>('$_roster_state');

/**
 * Context for the currently "in-scope" rosters for an admin page.
 * Also contains logic for editing a match (EditMatchDialog required on the page).
 * For example, in the division edit page, this will contain all rosters in that division's groups.
 */
export class RosterContext {
	static get = get;
	static set = set;

	editingMatch: UnresolvedMatch | null;
	canEditRosters: boolean;
	map: SvelteMap<string, Roster>;

	constructor(list: Roster[]) {
		this.editingMatch = $state(null);
		this.canEditRosters = true;
		this.map = $state(new SvelteMap(list.map((roster) => [roster.id, roster])));
	}

	editMatch = (match: UnresolvedMatch, canEditRosters?: boolean) => {
		if (!match.id) return;

		this.editingMatch = match;
		this.canEditRosters = canEditRosters ?? true;
	};

	stopMatchEdit = () => {
		this.editingMatch = null;
	};

	/** Looks up a roster by id. */
	find = (id?: string | null) => {
		return id ? this.map.get(id) : null;
	};
}
