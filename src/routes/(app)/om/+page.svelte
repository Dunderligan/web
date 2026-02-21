<script lang="ts">
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import screenshot1 from '$lib/assets/images/screenshot1.avif';
	import screenshot2 from '$lib/assets/images/screenshot2.avif';
	import Card from '$lib/components/structure/Card.svelte';
</script>

<Meta title="Om oss" />

<PageHeader title="Om oss" subtitle="Lite om turneringen och våran vision" />

<PageSection class="gap-2 space-y-18 text-lg font-medium">
	<Card title="Historia" image={screenshot1} alt="Screenshot från en Dunderligan-match">
		Dunderligan grundades 2019, och är idag Sveriges största Overwatch-liga. Årligen samlas närmare
		40 svenska lag med spelare från spelets alla olika ranker.
	</Card>

	<div class="mx-auto max-w-2xl">
		Rankanpassade divisioner gör att till exempel Champion-spelare inte ska behöva möta
		Platinum-spelare, utan snarare möta lag och spelare så nära deras egna skicklighetsnivå som
		möjligt. Detta bäddar för många jämna och roliga ligamatcher!
	</div>

	<Card title="Format" image={screenshot2} alt="Screenshot från en Dunderligan-match" reverse>
		Turneringen spelas en gång om året, den startar under våren och pågår under några månader. Varje
		lag spelar en handfull grundseriematcher innan slutspel väntar, för samtliga lag.
	</Card>

	<p class="mx-auto max-w-2xl">
		Under säsongens gång lägger vi även ner stor ansträngning på att matches ska kommenteras, båda
		live och i efterhand, för att sedan publiceras i vårt matcharkiv på YouTube.
	</p>
</PageSection>
