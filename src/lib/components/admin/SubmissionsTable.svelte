<script lang="ts">
	import type { TeamSubmissionInfo } from '$lib/types';
	import { formatDate } from '$lib/util';
	import SubmissionChip from './SubmissionChip.svelte';
	import Table from '../table/Table.svelte';
	import Button from '../ui/Button.svelte';

	type Props = {
		submissions: TeamSubmissionInfo[];
	};

	let { submissions }: Props = $props();
</script>

<Table
	rows={submissions}
	columns={[
		{ label: 'Lagnamn' },
		{ label: 'Status', center: true },
		{ label: 'Skapad', center: true },
		{ label: 'Redigerad', center: true },
		{ label: 'Granskad', center: true },
		{ label: '' }
	]}
	class="grid-cols-[auto_1fr_1fr_1fr_1fr_auto]"
	noBackground
>
	{#snippet row({ value: submission })}
		<div class="px-6 py-4 font-semibold">
			{submission.name}
		</div>

		<div class="justify-center">
			<SubmissionChip status={submission.status} />
		</div>

		{#each [submission.createdAt, submission.editedAt, submission.reviewedAt] as date}
			<div class="justify-center">
				{date ? formatDate(date) : '-'}
			</div>
		{/each}

		<div>
			<Button
				icon="ph:arrow-right"
				label="Hantera"
				kind="secondary"
				href="/admin/submission/{submission.id}"
			/>
		</div>
	{/snippet}
</Table>
