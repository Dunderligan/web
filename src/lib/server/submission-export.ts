import { averageRank, formatRank } from '$lib/rank';
import type { AnyRank, NullableFullRank, TeamSubmission } from '$lib/types';
import { capitalize, formatSubmissionStatus } from '$lib/util';

class SubmissionExporter {
	/**
	 * Converts a list of team submissions into a CSV string.
	 *
	 * The CSV contains the following columns:
	 * - Team name
	 * - Submission status
	 * - Captain's Discord username
	 * - Created at
	 * - Edited at
	 * - Reviewed at
	 * - Average rank of the team
	 * - For each player in the team:
	 *   - Player battletag
	 *   - Player rank
	 *   - Player role
	 */
	exportTeamSubmission(submissions: TeamSubmission[]): string {
		const maxPlayerCount = submissions
			.map((team) => team.data.members.length)
			.reduce((max, count) => Math.max(max, count), 0);

		const header = this.#joinCsvRow([
			'Namn',
			'Status',
			'Lagkaptenens Discord-användarnamn',
			'Skapad',
			'Redigerad',
			'Granskad',
			'Genomsnittlig rank',
			...Array.from({ length: maxPlayerCount }, (_, i) => [
				`Spelare ${i + 1} battletag`,
				`Spelare ${i + 1} rank`,
				`Spelare ${i + 1} roll`
			]).flat()
		]);

		const rows = submissions.map((team) => this.#createTeamRow(team, maxPlayerCount));

		return [header, ...rows].join('\n');
	}

	#createTeamRow({ info, data }: TeamSubmission, maxPlayerCount: number): string {
		const missingPlayers = maxPlayerCount - data.members.length;

		return this.#joinCsvRow([
			data.name,
			formatSubmissionStatus(info.status),
			data.captainDiscordUsername,
			info.createdAt.toISOString(),
			info.editedAt?.toISOString(),
			info.reviewedAt?.toISOString(),
			this.#rankToString(averageRank(data.members)),
			...data.members
				.map((member) => [
					member.player.battletag,
					this.#rankToString(member),
					capitalize(member.role)
				])
				.flat(),
			...Array.from({ length: missingPlayers }, () => [null, null, null]).flat()
		]);
	}

	#rankToString(rank: NullableFullRank | null): string | null {
		if (rank === null || rank.rank === null || rank.tier === null) return null;
		// Typescript doesn't understand that the null checks above guarantee that
		// rank is a FullRank, so we need to cast it explicitly.
		return capitalize(formatRank(rank as AnyRank));
	}

	#joinCsvRow(values: (string | null | undefined)[]): string {
		return values.map(this.#escapeCsvValue).join(',');
	}

	#escapeCsvValue(value: string | null | undefined): string {
		if (value === null || value === undefined || value.length === 0) {
			return '';
		}
		return `"${value.replace(/"/g, '""')}"`;
	}
}

const exporter = new SubmissionExporter();

export default exporter;
