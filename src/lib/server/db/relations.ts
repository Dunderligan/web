import { defineRelations } from 'drizzle-orm';
import schema from './schema.js';

const relations = defineRelations(schema, (r) => ({
	season: {
		divisions: r.many.division(),
		registration: r.one.registration(),
		checkins: r.many.playerCheckin()
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
		socials: r.many.teamSocial()
	},
	roster: {
		team: r.one.team({ from: r.roster.teamId, to: r.team.id, optional: false }),
		group: r.one.group({
			from: r.roster.groupId,
			to: r.group.id,
			optional: false
		}),
		members: r.many.member(),
		matchesAsA: r.many.match({ alias: 'rosterA' }),
		matchesAsB: r.many.match({ alias: 'rosterB' }),
		submission: r.one.teamSubmission({
			from: r.roster.id,
			to: r.teamSubmission.approvedRosterId
		})
	},
	teamSocial: {
		team: r.one.team({ from: r.teamSocial.teamId, to: r.team.id, optional: false })
	},
	playerSocial: {
		player: r.one.player({ from: r.playerSocial.playerId, to: r.player.id, optional: false })
	},
	player: {
		memberships: r.many.member(),
		socials: r.many.playerSocial(),
		aliases: r.many.playerAlias(),
		signatureHeroes: r.many.signatureHero(),
		checkins: r.many.playerCheckin()
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
		rosterA: r.one.roster({ from: r.match.rosterAId, to: r.roster.id, alias: 'rosterA' }),
		rosterB: r.one.roster({ from: r.match.rosterBId, to: r.roster.id, alias: 'rosterB' }),
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
	},
	registration: {
		season: r.one.season({
			from: r.registration.seasonId,
			to: r.season.id,
			optional: false
		}),
		submissions: r.many.teamSubmission()
	},
	teamSubmission: {
		registration: r.one.registration({
			from: r.teamSubmission.registrationId,
			to: r.registration.id,
			optional: false
		}),
		submittedBy: r.one.user({
			from: r.teamSubmission.submittedById,
			to: r.user.id,
			alias: 'submittedBy'
		}),
		reviewedBy: r.one.user({
			from: r.teamSubmission.reviewedById,
			to: r.user.id,
			alias: 'reviewedBy'
		}),
		approvedRoster: r.one.roster({
			from: r.teamSubmission.approvedRosterId,
			to: r.roster.id
		})
	},
	apiKey: {
		user: r.one.user({
			from: r.apiKey.userId,
			to: r.user.id,
			optional: false
		})
	},
	user: {
		apiKeys: r.many.apiKey(),
		submittedTeams: r.many.teamSubmission({ alias: 'submittedBy' }),
		reviewedTeams: r.many.teamSubmission({ alias: 'reviewedBy' })
	},
	hero: {
		signaturePlayers: r.many.signatureHero()
	},
	signatureHero: {
		player: r.one.player({
			from: r.signatureHero.playerId,
			to: r.player.id,
			optional: false
		}),
		hero: r.one.hero({
			from: r.signatureHero.heroId,
			to: r.hero.id,
			optional: false
		})
	},
	playerAlias: {
		player: r.one.player({
			from: r.playerAlias.playerId,
			to: r.player.id,
			optional: false
		})
	},
	playerCheckin: {
		player: r.one.player({
			from: r.playerCheckin.playerId,
			to: r.player.id,
			optional: false
		}),
		season: r.one.season({
			from: r.playerCheckin.seasonId,
			to: r.season.id,
			optional: false
		})
	}
}));

export default relations;
