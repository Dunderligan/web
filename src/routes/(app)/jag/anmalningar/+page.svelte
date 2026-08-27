<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import SubmissionsTable from '$lib/components/table/SubmissionsTable.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import { SubmissionStatus } from '$lib/types.js';

	let { data } = $props();
</script>

<PageSection>
	<AdminCard title="Anmälningar">
		<SubmissionsTable
			submissions={data.submissions}
			shownStatuses={Object.values(SubmissionStatus)}
		/>
	</AdminCard>
</PageSection>
