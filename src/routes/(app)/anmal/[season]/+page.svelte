<script lang="ts">
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

	let { data } = $props();

	const closed = $derived(Date.now() >= data.registration.closeDate.getTime());
</script>

<PageSection>
	<Button label="Tillbaka" href="/" kind="secondary" icon="ph:arrow-left" class="mb-2" />

	{#if closed}
		<Notice kind="warn">Anmälan för denna säsong är stängd.</Notice>
	{:else}
		<iframe
			src={data.registration.url}
			width="100%"
			height="4100"
			frameborder="0"
			title="Anmälningsformulär"
			class="mx-auto"
		>
			Laddar formulär...
		</iframe>
	{/if}
</PageSection>
