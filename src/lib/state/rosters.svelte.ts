import type { Match, Roster } from '$lib/types';
import { SvelteMap } from 'svelte/reactivity';
import { defineContext } from './util';

const { get, set } = defineContext<RosterState>('$_roster_state');

export class RosterState {
	static get = () => get();
	static set = (value: RosterState) => set(value);

	editingMatch: Match | null;
	list: Map<string, Roster>;

	constructor(list: Roster[]) {
		this.editingMatch = $state(null);
		this.list = $state(new Map(list.map((roster) => [roster.id, roster])));
	}

	edit = (match: Match) => {
		if (!match.id) return;

		this.editingMatch = match;
	};

	stopEditing = () => {
		this.editingMatch = null;
	};

	find = (id?: string | null) => {
		return id ? this.list.get(id) : null;
	};
}
