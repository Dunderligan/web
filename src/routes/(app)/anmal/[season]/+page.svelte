<script lang="ts">
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

	let { data } = $props();
</script>

<PageSection>
	{#if !data.registration.open}
		<Notice kind="warn">Anmälan för denna säsong är stängd.</Notice>
	{:else}
		<iframe
			src={data.registration.url}
			width="640"
			height="1000"
			frameborder="0"
			marginheight="0"
			marginwidth="0"
			title="Anmälningsformulär"
			class="mx-auto"
		>
			Laddar formulär...
		</iframe>
	{/if}
</PageSection>
