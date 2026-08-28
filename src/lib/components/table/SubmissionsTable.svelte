<script lang="ts">
	import { SubmissionStatus, type TeamSubmissionInfo } from '$lib/types';
	import { formatDate, formatSubmissionStatus } from '$lib/util';
	import SubmissionChip from '../admin/SubmissionChip.svelte';
	import Table from './Table.svelte';
	import Button from '../ui/Button.svelte';
	import Label from '../form/Label.svelte';
	import Select from '../form/Select.svelte';

	type Props = {
		submissions: TeamSubmissionInfo[];
		shownStatuses?: SubmissionStatus[];
	};

	let { submissions, shownStatuses = $bindable([SubmissionStatus.PENDING]) }: Props = $props();

	const shownSubmissions = $derived(
		submissions
			.filter(
				(submission) => shownStatuses.length === 0 || shownStatuses.includes(submission.status)
			)
			.toSorted((a, b) => compareStatus(a, b) || b.createdAt.getTime() - a.createdAt.getTime())
	);

	function compareStatus(a: TeamSubmissionInfo, b: TeamSubmissionInfo) {
		const statusOrder = ['pending', 'approved', 'rejected'];
		return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
	}
</script>

<Label label="Filtrera efter status">
	<Select
		type="multiple"
		class="grow"
		bind:value={shownStatuses}
		placeholder="Välj status..."
		items={Object.values(SubmissionStatus).map((status) => ({
			value: status,
			label: formatSubmissionStatus(status)
		}))}
	/>
</Label>

<Table
	kind="transparent"
	rows={shownSubmissions}
	columns={[
		{ label: 'Lagnamn', width: '1fr' },
		{ label: 'Status', center: true },
		{ label: 'Skapad', center: true },
		{ label: 'Redigerad', center: true },
		{ label: 'Granskad', center: true },
		{}
	]}
	placeholder={{
		icon: 'ph:magnifying-glass',
		text: 'Inga anmälningar att visa'
	}}
>
	{#snippet row({ value: submission })}
		<div class="py-4 text-lg font-semibold">
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
				kind="tertiary"
				href="/admin/laganmalan/{submission.id}"
			/>
		</div>
	{/snippet}
</Table>
