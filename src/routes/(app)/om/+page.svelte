<script lang="ts">
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import screenshot1 from '$lib/assets/images/screenshot1.avif';
	import screenshot2 from '$lib/assets/images/screenshot2.avif';
</script>

<Meta title="Om oss" />

<PageHeader title="Om oss">
	<div
		class="mt-2 mb-1 text-center text-xl font-semibold text-gray-800 sm:text-left dark:text-gray-300"
	>
		Lite om turneringen och våran vision
	</div>
</PageHeader>

<PageSection class="gap-2 space-y-18 text-lg font-medium">
	{@render card(
		'Historia',
		screenshot1,
		'Screenshot från en Dunderligan-match',
		'Dunderligan grundades 2019, och är idag Sveriges största Overwatch-liga. Årligen samlas närmare 40 svenska lag med spelare från spelets alla olika ranker, som gör upp i skicklighetsanpassade divisioner.'
	)}

	<div class="mx-auto max-w-2xl">
		De rankanpassade divisionerna gör att till exempel Champion-spelare inte ska behöva möta
		Platinum-spelare, utan snarare möta lag och spelare så nära deras egna skicklighetsnivå som
		möjligt. Detta bäddar för många jämna och roliga ligamatcher!
	</div>

	{@render card(
		'Format',
		screenshot2,
		'Screenshot från en Dunderligan-match',
		'Turneringen spelas en gång om året, den startar under våren och pågår under några månader. Varje lag spelar en handfull grundseriematcher innan slutspel väntar, för samtliga lag.',
		true
	)}

	<p class="mx-auto max-w-2xl">
		Under säsongens gång lägger vi även ner stor ansträngning på att matches ska kommenteras, båda
		live och i efterhand, för att sedan publiceras i vårt matcharkiv på YouTube.
	</p>
</PageSection>

{#snippet card(title: string, image: string, alt: string, text: string, reverse: boolean = false)}
	<div
		class={[
			reverse ? 'lg:flex-row-reverse' : 'lg:flex-row',
			'flex flex-col overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900'
		]}
	>
		<img src={image} {alt} class="lg:w-110" />

		<div class="px-10 py-8">
			<h3 class="mb-2 text-xl font-semibold">{title}</h3>

			<p>
				{@html text}
			</p>
		</div>
	</div>
{/snippet}
