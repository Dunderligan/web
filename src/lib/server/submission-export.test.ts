import { describe, expect, it } from 'vitest';
import exporter from '$lib/server/submission-export';
import { Rank, Role, SubmissionStatus, type Member, type TeamSubmission } from '$lib/types';

function member(battletag: string, rank: Rank | null, tier: number | null, role: Role): Member {
	return {
		role,
		rank,
		tier,
		sr: null,
		isCaptain: false,
		registeredName: null,
		player: { id: null, battletag }
	};
}

function team(
	overrides: {
		name?: string;
		status?: SubmissionStatus;
		members?: Member[];
		editedAt?: Date | null;
		reviewedAt?: Date | null;
	} = {}
): TeamSubmission {
	const name = overrides.name ?? 'Lag A';
	return {
		data: {
			name,
			captainDiscordUsername: 'cap',
			members: overrides.members ?? [member('P#1', Rank.GOLD, 1, Role.DAMAGE)]
		},
		info: {
			id: 'sub',
			name,
			status: overrides.status ?? SubmissionStatus.APPROVED,
			createdAt: new Date('2026-03-05T00:00:00.000Z'),
			reviewedAt: overrides.reviewedAt ?? null,
			editedAt: overrides.editedAt ?? null
		}
	};
}

describe('exportTeamSubmission', () => {
	it('emits only the base header when there are no submissions', () => {
		const lines = exporter.exportTeamSubmission([]).split('\n');
		expect(lines).toHaveLength(1);
		expect(lines[0].split(',')).toHaveLength(7);
	});

	it('writes a player column group for the longest team', () => {
		const csv = exporter.exportTeamSubmission([team()]);
		const [header] = csv.split('\n');

		expect(header).toBe(
			[
				'"Namn"',
				'"Status"',
				'"Lagkaptenens Discord-användarnamn"',
				'"Skapad"',
				'"Redigerad"',
				'"Granskad"',
				'"Genomsnittlig rank"',
				'"Spelare 1 battletag"',
				'"Spelare 1 rank"',
				'"Spelare 1 roll"'
			].join(',')
		);
	});

	it('writes team data and the average rank', () => {
		const csv = exporter.exportTeamSubmission([team()]);
		const row = csv.split('\n')[1];

		expect(row).toContain('"Lag A"');
		expect(row).toContain('"Godkänd"');
		expect(row).toContain('"cap"');
		expect(row).toContain('"2026-03-05T00:00:00.000Z"');
		expect(row).toContain('"Gold 1"');
		expect(row).toContain('"P#1"');
		expect(row).toContain('"Damage"');
	});

	it('leaves the edited and reviewed columns empty when unset', () => {
		const row = exporter.exportTeamSubmission([team()]).split('\n')[1];
		// created, edited, reviewed -> the two unset timestamps are empty
		expect(row).toContain('"2026-03-05T00:00:00.000Z",,,');
	});

	it('escapes quotes by doubling them', () => {
		const csv = exporter.exportTeamSubmission([team({ name: 'Lag "A"' })]);
		expect(csv).toContain('"Lag ""A"""');
	});

	it('leaves the rank cell empty for unranked members', () => {
		const csv = exporter.exportTeamSubmission([
			team({
				members: [member('P#1', null, null, Role.DAMAGE), member('P#2', Rank.GOLD, 1, Role.DAMAGE)]
			})
		]);
		const row = csv.split('\n')[1];

		expect(row).toContain('"P#1",,"Damage"');
	});

	it('pads shorter teams with empty player columns', () => {
		const short = team();
		const long = team({
			name: 'Lag B',
			members: [
				member('P#2', Rank.SILVER, 2, Role.SUPPORT),
				member('P#3', Rank.SILVER, 2, Role.TANK),
				member('P#4', Rank.BRONZE, 5, Role.FLEX)
			]
		});

		const lines = exporter.exportTeamSubmission([short, long]).split('\n');
		expect(lines).toHaveLength(3);

		const columns = lines[0].split(',').length;
		expect(lines[1].split(',')).toHaveLength(columns);
		expect(lines[2].split(',')).toHaveLength(columns);
	});
});
