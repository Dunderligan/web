import { reset } from 'drizzle-seed';
import { schema } from '.';
import { Rank, Role } from '$lib/types';
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
		roster: schema.roster,
		member: schema.member,
		season: schema.season,
		division: schema.division,
		group: schema.group,
		match: schema.match,
		social: schema.social
	};

	await reset(db, seedSchema);

	let [season] = await db
		.insert(schema.season)
		.values({ name: 'Test Säsong', slug: 'test-sasong', startedAt: new Date() })
		.returning();

	let divisions = await Promise.all(
		Array.from({ length: 3 }).map(async (_, i) => {
			let name = `Division ${i + 1}`;
			let slug = `${i + 1}`;

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

	let groups = await Promise.all(
		divisions.flatMap((division) =>
			Array.from({ length: 2 }).map(async (_, i) => {
				let slug = String.fromCharCode(65 + i);
				let name = `Grupp ${slug}`;

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

	let teams = await Promise.all(
		Array.from({ length: groups.length * 4 }).map(() =>
			db.insert(schema.team).values({}).returning()
		)
	);

	let rosters = await Promise.all(
		teams.map(async (team, i) => {
			let name = generateTeamName();
			let slug = name.toLowerCase().replaceAll(' ', '-').replaceAll('#', '');
			let groupIndex = i % groups.length;

			let result = await db
				.insert(schema.roster)
				.values({
					name,
					slug,
					seasonSlug: season.slug,
					teamId: team[0].id,
					groupId: groups[groupIndex].id
				})
				.returning();

			return result[0];
		})
	);

	let players = await Promise.all(
		Array.from({ length: teams.length * 6 }).map(async () => {
			let battletag = `Spelare #${rand()}`;

			let result = await db
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
			let rosterIndex = i % rosters.length;
			let rank = [
				Rank.BRONZE,
				Rank.SILVER,
				Rank.GOLD,
				Rank.PLATINUM,
				Rank.DIAMOND,
				Rank.MASTER,
				Rank.GRANDMASTER,
				Rank.CHAMPION
			][Math.floor(Math.random() * 8)];
			let tier = Math.floor(Math.random() * 5) + 1;
			let isCaptain = i % 7 === 0;

			await db.insert(schema.member).values({
				playerId: player.id,
				rosterId: rosters[rosterIndex].id,
				rank,
				tier,
				isCaptain,
				role: ['damage', 'tank', 'support'][i % 3] as Role
			});
		})
	);

	await Promise.all(
		groups.map(async (group) => {
			let groupRosters = rosters.filter((roster) => roster.groupId === group.id);

			for (let i = 0; i < groupRosters.length; i++) {
				for (let j = i + 1; j < groupRosters.length; j++) {
					let teamAScore = Math.floor(Math.random() * 4);
					let teamBScore = 3 - teamAScore;

					await db.insert(schema.match).values({
						groupId: group.id,
						rosterAId: groupRosters[i].id,
						rosterBId: groupRosters[j].id,
						teamAScore,
						teamBScore,
						played: true,
						playedAt: new Date(),
						scheduledAt: new Date(),
						draws: 3 - (teamAScore + teamBScore)
					});
				}
			}
		})
	);
}
