<script lang="ts">
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';

	import Subheading from '$lib/components/ui/Subheading.svelte';
	import Accordion from '$lib/components/ui/Accordions.svelte';

	const items = [
		{title: "Vilka spelare kan tävla i Dunderligan?", content: "Alla Overwatch-spelare från Sverige. Ni kan skapa ett lag med spelare i olika ranker och som spelar på olika plattformer (PC, konsol), så länge ni är svenskar."},
		{title: "Hur ofta är Dunderligan?", content: "Dunderligan spelas en gång om året och har gjort det sedan 2019. Sedan några år tillbaka har säsongerna alltid börjat i mars/april."},
		{title: "Vad kan jag vinna i Dunderligan?", content: 'Egentligen ingenting mer än ära och en "good time". Det finns inga prispengar eller andra belöningar för de lag som vinner.'},		
		{title: "Vilken rank måste man vara i Dunderligan?", content: "Alla ranker är välkomna. Ditt lag kommer efter anmälning att seedas utifrån anmäld rank på spelare för att hamn i en så jämn division som möjligt. Varje år har vi spelare i allt ifrån brons upp till champion, verkligen alla ranker finns representerade."},
		{title: "Hur länge pågår Dunderligan?", content: "Ungefär två månader pågår ligan, förutsatt att ditt lag tar sig hela vägen fram till en final."},		
		{title: "Finns Dunderligan i andra spel?", content: "Nej. Bara i Overwatch."},	
		{title: "Kommer matcher att sändas live?", content: "Ja, ganska många dessutom. Och vissa som inte sänds live kommer att i efterhand publiceras på våran YouTube-kanal genom att vods castas med hjälp av replaykoder. Vi brukar alltid anstränga oss för att varje lag ska få åtminstone en match publicerad på YouTube."},
		{title: "Hur kan jag hjälpa till i Dunderligan?", content: "DL existerar på grund utav och tackvare eldsjälar. Varje år behöver vi hjälp med modsysslor på discordservern, redigerare, casters, grafiker och bildproducenter för att nämna några. Vill du hjälpa till och känner att du kanske har något som du kan tillföra, ta kontakt med moderatorerna på discordservern."},		
	];
</script>

<Meta title="FAQ" />

<PageHeader title="FAQ">
	<div
		class="mt-2 mb-1 text-center text-xl font-semibold text-gray-800 sm:text-left dark:text-gray-300"
	>
		Svar på några av de vanligast förekommande frågorna.
	</div>
</PageHeader>

<PageSection class="gap-2 text-lg font-medium">
	<Subheading class="mb-4">Vanliga Frågor</Subheading>
	<Accordion type="multiple" {items}></Accordion>
	<Subheading class="mt-8">Undrar du fortfarande något?</Subheading>
	Gå med i vår discordserver!
</PageSection>
