import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { reset, seed } from 'drizzle-seed';
import { Rank } from './schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

const db = drizzle(client, { schema, casing: 'snake_case' });

function rand() {
	return Math.floor(100000 + Math.random() * 900000);
}

async function seedDb() {
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

	/*
	await seed(db, seedSchema).refine((f) => ({
		team: {
			count: 32
		},
		roster: {
			count: 32 * 2
		},
		player: {
			count: 32 * 2 * 7
		},
		member: {
			count: 32 * 2 * 7 + 3,
			columns: {
				tier: f.int({ minValue: 1, maxValue: 5 })
			}
		},
		season: {
			count: 1
		},
		division: {
			count: 3
		},
		group: {
			count: 3 * 3
		},
		match: {
			count: 128
		},
		social: {
			count: 32
		}
	}));
	*/

	let [season] = await db
		.insert(schema.season)
		.values({ name: 'Test Säsong', slug: 'test', startedAt: new Date() })
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
			Array.from({ length: 3 }).map(async (_, i) => {
				let slug = String.fromCharCode(65 + i);
				let name = `Grupp ${slug}`;

				const res = await db
					.insert(schema.group)
					.values({
						name,
						slug,
						divisionId: division.id
					})
					.returning();

				return res[0];
			})
		)
	);

	let teams = await Promise.all(
		Array.from({ length: 40 }).map(() => db.insert(schema.team).values({}).returning())
	);

	let rosters = await Promise.all(
		teams.map(async (team) => {
			let name = `Lag #${rand()}`;
			let slug = name.toLowerCase().replaceAll(' ', '-').replaceAll('#', '');
			let groupIndex = Math.floor(Math.random() * groups.length);

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
		Array.from({ length: 40 * 6 }).map(async () => {
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
				role: ['damage', 'tank', 'support'][i % 3] as schema.Role
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
						draws: 3 - (teamAScore + teamBScore)
					});
				}
			}
		})
	);
}

//await seedDb();

export { db, schema };
