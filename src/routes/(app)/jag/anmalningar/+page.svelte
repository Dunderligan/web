<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import SubmissionsTable from '$lib/components/admin/SubmissionsTable.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';

	let { data } = $props();
</script>

<PageSection>
	<AdminCard title="Anmälningar">
		<SubmissionsTable submissions={data.submissions} />
	</AdminCard>
</PageSection>
