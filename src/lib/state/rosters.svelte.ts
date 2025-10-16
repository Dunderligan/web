import type { FullMatchWithoutOrder, Roster } from '$lib/types';
import { defineContext } from './util';

const { get, set } = defineContext<RosterContext>('$_roster_state');

export class RosterContext {
	static get = get;
	static set = set;

	editingMatch: FullMatchWithoutOrder | null;
	canEditRosters: boolean;
	map: Map<string, Roster>;

	constructor(list: Roster[]) {
		this.editingMatch = $state(null);
		this.canEditRosters = true;
		this.map = $state(new Map(list.map((roster) => [roster.id, roster])));
	}

	editMatch = (match: FullMatchWithoutOrder, canEditRosters?: boolean) => {
		if (!match.id) return;

		this.editingMatch = match;
		this.canEditRosters = canEditRosters ?? true;
	};

	stopMatchEdit = () => {
		this.editingMatch = null;
	};

	find = (id?: string | null) => {
		return id ? this.map.get(id) : null;
	};
}
