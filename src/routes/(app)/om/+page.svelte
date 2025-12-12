<script lang="ts">
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
</script>

<svelte:head>
	<title>Om oss | Dunderligan</title>
	<meta
		name="description"
		content="Om Dunderligan, Sveriges största återkommande Overwatchturnering."
	/>

	<meta
		property="og:description"
		content="Om Dunderligan, Sveriges största återkommande Overwatchturnering."
	/>
</svelte:head>

<PageHeader title="Om oss"></PageHeader>

<PageSection class="text-lg font-medium">
	<p class="mb-8">
		Dunderligan är Sveriges största återkommande Overwatchturnering som årligen samlar 32 lag från
		alla ranker för att göra upp om vem som är bäst. Turneringen delas upp i olika divisioner enligt
		rankerna på lagens spelare, så alla har en chans att ha kul och visa upp sig själva.
	</p>

	<p class="mb-8">
		Turneringen startar under våren, och pågår under några månader. Alla lag delas in i divisioner
		där de först spelar 3 gruppspelsmatcher för att bestämma seeding, och sedan ger sig in i ett
		slutspel för att avgöra säsongens vinnare. Under säsongens gång kommenteras matcher
		kontinuerligt, både live och i efterhand, för att ge spelare en chans att visa upp sig själv.
	</p>
</PageSection>
