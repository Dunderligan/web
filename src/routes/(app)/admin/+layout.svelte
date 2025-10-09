<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';

	let { children } = $props();
</script>

<PageSection class="space-y-8">
	{@render children()}
</PageSection>
