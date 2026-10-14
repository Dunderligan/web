<script lang="ts">
	import type { TeamSubmissionInfo } from '$lib/types';
	import { formatDate } from '$lib/util';
	import SubmissionChip from '../admin/SubmissionChip.svelte';
	import NewTable from './NewTable.svelte';
	import Button from '../ui/Button.svelte';

	type Props = {
		submissions: TeamSubmissionInfo[];
	};

	let { submissions }: Props = $props();

	const shownSubmissions = $derived(
		submissions.toSorted(
			(a, b) => compareStatus(a, b) || b.createdAt.getTime() - a.createdAt.getTime()
		)
	);

	function compareStatus(a: TeamSubmissionInfo, b: TeamSubmissionInfo) {
		const statusOrder = ['pending', 'approved', 'rejected'];
		return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
	}
</script>

{#snippet nameCell(submission: TeamSubmissionInfo)}
	{submission.name}
{/snippet}

{#snippet statusCell(submission: TeamSubmissionInfo)}
	<SubmissionChip status={submission.status} />
{/snippet}

{#snippet actionCell(submission: TeamSubmissionInfo)}
	<Button
		icon="ph:arrow-right"
		label="Hantera"
		kind="tertiary"
		href="/admin/laganmalan/{submission.id}"
	/>
{/snippet}

<NewTable
	kind="transparent"
	rows={shownSubmissions}
	key={(submission) => submission.id}
	columns={[
		{ label: 'Lagnamn', snippet: nameCell, class: 'text-lg font-semibold' },
		{ label: 'Status', snippet: statusCell, center: true },
		{
			label: 'Skapad',
			content: (submission) => (submission.createdAt ? formatDate(submission.createdAt) : '-'),
			center: true
		},
		{
			label: 'Redigerad',
			content: (submission) => (submission.editedAt ? formatDate(submission.editedAt) : '-'),
			center: true
		},
		{
			label: 'Granskad',
			content: (submission) => (submission.reviewedAt ? formatDate(submission.reviewedAt) : '-'),
			center: true
		},
		{ snippet: actionCell }
	]}
	placeholder={{
		icon: 'ph:magnifying-glass',
		text: 'Inga anmälningar att visa'
	}}
/>
