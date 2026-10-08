import { reset } from 'drizzle-seed';
import schema from './schema';
import { MatchState, Rank, Role } from '$lib/types';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

function rand() {
	return Math.floor(100000 + Math.random() * 900000);
}

function pick<T>(list: T[]) {
	return list[Math.floor(Math.random() * list.length)];
}

const ADJECTIVES = [
	'Skoningslösa',
	'Starka',
	'Mäktiga',
	'Listiga',
	'Fantastiska',
	'Coola',
	'Snygga',
	'Läskiga',
	'Blöta',
	'Torra',
	'Trasiga',
	'Omedvetna',
	'Runda',
	'Glansiga',
	'Underbara',
	'Vidriga',
	'Mogna',
	'Flexibla',
	'Stela',
	'Allvetande',
	'Öppensinnade',
	'Uppblåsta',
	'Stångsugna',
	'Överskattade',
	'Stiliga',
	'Rika',
	'Fattiga',
	'Hemlösa',
	'Bosatta',
	'Oklippta',
	'Anonyma',
	'Superba'
];

const NOUNS = [
	'Pojkarna',
	'Leoparderna',
	'Katterna',
	'Missarna',
	'Nissarna',
	'Grabbarna',
	'Ödlorna',
	'Hajarna',
	'Nördarna',
	'Björnarna',
	'Bumbibjörnarna',
	'Ormarna',
	'Riddarna',
	'Gamers',
	'Boysen',
	'Girlsen',
	'Drakarna',
	'Minionerna',
	'Pingvinerna',
	'Isbjörnarna',
	'Datorerna',
	'Pappertussarna',
	'Pandorna'
];

const usedNames = new Set<string>();

function generateTeamName() {
	while (true) {
		const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;

		if (!usedNames.has(name)) {
			usedNames.add(name);
			return name;
		}
	}
}

export async function seed(db: PostgresJsDatabase<typeof schema>) {
	const seedSchema = {
		team: schema.team,
		player: schema.player,
		awardType: schema.awardType,
		playerAward: schema.playerAward,
		roster: schema.roster,
		member: schema.member,
		season: schema.season,
		division: schema.division,
		group: schema.group,
		match: schema.match,
		teamSocial: schema.teamSocial,
		playerSocial: schema.playerSocial
	};

	await reset(db, seedSchema);

	const [season] = await db
		.insert(schema.season)
		.values({ name: 'Test Säsong', slug: 'test-sasong', startedAt: new Date() })
		.returning();

	const divisions = await Promise.all(
		Array.from({ length: 3 }).map(async (_, i) => {
			const name = `Division ${i + 1}`;
			const slug = `${i + 1}`;

			const res = await db
				.insert(schema.division)
				.values({
					name,
					slug,
					seasonId: season.id
				})
				.returning();

			return res[0];
		})
	);

	const groups = await Promise.all(
		divisions.flatMap((division) =>
			Array.from({ length: 2 }).map(async (_, i) => {
				const slug = String.fromCharCode(65 + i);
				const name = `Grupp ${slug}`;

				const res = await db
					.insert(schema.group)
					.values({
						name,
						slug: slug.toLowerCase(),
						divisionId: division.id
					})
					.returning();

				return res[0];
			})
		)
	);

	const teams = await Promise.all(
		Array.from({ length: groups.length * 4 }).map(() =>
			db.insert(schema.team).values({}).returning()
		)
	);

	const rosters = await Promise.all(
		teams.map(async (team, i) => {
			const name = generateTeamName();
			const slug = name.toLowerCase().replaceAll(' ', '-').replaceAll('#', '');
			const groupIndex = i % groups.length;

			const result = await db
				.insert(schema.roster)
				.values({
					name,
					slug,
					teamId: team[0].id,
					groupId: groups[groupIndex].id
				})
				.returning();

			return result[0];
		})
	);

	const players = await Promise.all(
		Array.from({ length: teams.length * 6 }).map(async () => {
			const battletag = `Spelare#${rand()}`;

			const result = await db
				.insert(schema.player)
				.values({
					battletag
				})
				.returning();

			return result[0];
		})
	);

	await Promise.all(
		players.map(async (player, i) => {
			const rank = [
				Rank.BRONZE,
				Rank.SILVER,
				Rank.GOLD,
				Rank.PLATINUM,
				Rank.DIAMOND,
				Rank.MASTER,
				Rank.GRANDMASTER,
				Rank.CHAMPION
			][Math.floor(Math.random() * 8)];
			const tier = Math.floor(Math.random() * 5) + 1;

			const rosterIndex = i % rosters.length;
			const roster = rosters[rosterIndex];

			const memberIndex = Math.floor(i / rosters.length);
			const isCaptain = memberIndex % 6 === 0;
			const role = [Role.DAMAGE, Role.SUPPORT, Role.FLEX, Role.TANK][memberIndex % 4];

			await db.insert(schema.member).values({
				playerId: player.id,
				rosterId: roster.id,
				rank,
				tier,
				isCaptain,
				role
			});
		})
	);

	await Promise.all(
		groups.map(async (group) => {
			const groupRosters = rosters.filter((roster) => roster.groupId === group.id);

			for (let i = 0; i < groupRosters.length; i++) {
				for (let j = i + 1; j < groupRosters.length; j++) {
					const teamAScore = Math.floor(Math.random() * 4);
					const teamBScore = 3 - teamAScore;

					await db.insert(schema.match).values({
						groupId: group.id,
						rosterAId: groupRosters[i].id,
						rosterBId: groupRosters[j].id,
						teamAScore,
						teamBScore,
						state: MatchState.PLAYED,
						playedAt: new Date(),
						scheduledAt: new Date(),
						draws: 3 - (teamAScore + teamBScore)
					});
				}
			}
		})
	);
}
