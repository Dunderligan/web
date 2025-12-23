import { defineRelations } from 'drizzle-orm';
import schema from './schema.js';

const relations = defineRelations(schema, (r) => ({
	season: {
		divisions: r.many.division()
	},
	division: {
		season: r.one.season({
			from: r.division.seasonId,
			to: r.season.id,
			optional: false
		}),
		groups: r.many.group(),
		brackets: r.many.bracket()
	},
	group: {
		division: r.one.division({
			from: r.group.divisionId,
			to: r.division.id,
			optional: false
		}),
		rosters: r.many.roster(),
		matches: r.many.match()
	},
	team: {
		rosters: r.many.roster(),
		socials: r.many.social()
	},
	roster: {
		team: r.one.team({ from: r.roster.teamId, to: r.team.id, optional: false }),
		group: r.one.group({
			from: r.roster.groupId,
			to: r.group.id,
			optional: false
		}),
		members: r.many.member()
	},
	social: {
		team: r.one.team({ from: r.social.teamId, to: r.team.id, optional: false })
	},
	player: {
		memberships: r.many.member()
	},
	member: {
		player: r.one.player({
			from: r.member.playerId,
			to: r.player.id,
			optional: false
		}),
		roster: r.one.roster({
			from: r.member.rosterId,
			to: r.roster.id,
			optional: false
		})
	},
	match: {
		rosterA: r.one.roster({ from: r.match.rosterAId, to: r.roster.id }),
		rosterB: r.one.roster({ from: r.match.rosterBId, to: r.roster.id }),
		bracket: r.one.bracket({ from: r.match.bracketId, to: r.bracket.id }),
		group: r.one.group({ from: r.match.groupId, to: r.group.id })
	},
	bracket: {
		division: r.one.division({
			from: r.bracket.divisionId,
			to: r.division.id,
			optional: false
		}),
		matches: r.many.match()
	}
}));

export default relations;
