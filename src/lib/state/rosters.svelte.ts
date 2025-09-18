import type { Match, Roster } from '$lib/types';
import { defineContext } from './util';

const { get, set } = defineContext<RosterState>('$_roster_state');

export class RosterState {
	static get = get;
	static set = set;

	editingMatch: Match | null;
	map: Map<string, Roster>;

	constructor(list: Roster[]) {
		this.editingMatch = $state(null);
		this.map = $state(new Map(list.map((roster) => [roster.id, roster])));
	}

	edit = (match: Match) => {
		if (!match.id) return;

		this.editingMatch = match;
	};

	stopEditing = () => {
		this.editingMatch = null;
	};

	find = (id?: string | null) => {
		return id ? this.map.get(id) : null;
	};
}
