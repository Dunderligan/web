<script lang="ts">
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import screenshot1 from '$lib/assets/images/screenshot1.avif';
	import screenshot2 from '$lib/assets/images/screenshot2.avif';
	import Card from '$lib/components/structure/Card.svelte';

	const heads = [
		{
			name: 'StarkeAdrian',
			battletag: 'StarkeAdrian#2577',
			subtitle: 'Grundare',
			image:
				'https://cdn.discordapp.com/avatars/198066135260725248/787d91a2d2013e97ac0ce86dcb1ce113.png?size=512'
		},
		{
			name: 'Njukas',
			battletag: 'Njukas#2306',
			subtitle: 'Ledamot',
			image:
				'https://cdn.discordapp.com/avatars/243099357455450123/5bd83d7e88d450f78f01ed680e0b2a31.png?size=512'
		},
		{
			name: 'jidosc',
			battletag: 'BattleGnome#21353',
			subtitle: 'Ledamot',
			image:
				'https://cdn.discordapp.com/avatars/363309749334310916/e9a29309a66bedf0c2ba15fc2b465832.png?size=512'
		},
		{
			name: 'Frallex',
			battletag: 'Frallex3000#2875',
			subtitle: 'Mangoätare',
			image:
				'https://cdn.discordapp.com/avatars/404232721330601985/149900190579b10e5a65fbb54624988c.png?size=512'
		},
		{
			name: 'TheRaggebus',
			battletag: 'Ragge#2367',
			subtitle: 'Ledamot',
			image:
				'https://cdn.discordapp.com/avatars/195133981623189505/4c96e0b1ac658933e039abeaeb5764d7.png?size=512'
		},
		{
			name: 'Stetsonbryl',
			battletag: 'Stetsonbryl#2279',
			subtitle: 'Ledamot',
			image:
				'https://cdn.discordapp.com/avatars/269894953998483458/53aebc5c8a42852158067f7c143e89b6.png?size=512'
		},
		{
			name: 'zarre',
			battletag: 'bog#22351',
			subtitle: 'Ledamot',
			image:
				'https://cdn.discordapp.com/avatars/391296769369178133/f7dc9f9bbf84229fb42ece9492075860.png?size=512'
		}
	];
</script>

<Meta title="Om oss" />

<PageHeader title="Om oss" subtitle="Lite om turneringen och våran vision" />

<PageSection class="text-lg font-medium">
	<div class="space-y-18">
		<Card title="Historia" image={screenshot1} alt="Screenshot från en Dunderligan-match">
			Dunderligan grundades 2019, och är idag Sveriges största Overwatch-liga. Årligen samlas
			närmare 40 svenska lag med spelare från spelets alla olika ranker.
		</Card>

		<div class="mx-auto max-w-2xl">
			Rankanpassade divisioner gör att till exempel Champion-spelare inte ska behöva möta
			Platinum-spelare, utan snarare möta lag och spelare så nära deras egna skicklighetsnivå som
			möjligt. Detta bäddar för många jämna och roliga ligamatcher!
		</div>

		<Card title="Format" image={screenshot2} alt="Screenshot från en Dunderligan-match" reverse>
			Turneringen spelas en gång om året, den startar under våren och pågår under några månader.
			Varje lag spelar en handfull grundseriematcher innan slutspel väntar, för samtliga lag.
		</Card>

		<p class="mx-auto max-w-2xl">
			Under säsongens gång lägger vi även ner stor ansträngning på att matches ska kommenteras, båda
			live och i efterhand, för att sedan publiceras i vårt matcharkiv på YouTube.
		</p>
	</div>

	<h2 class="mt-14 text-center font-display text-4xl font-bold">Ligaledningen</h2>

	<p class="mx-auto mt-4 max-w-2xl">
		Ledningen är ligans högsta höns och ansvarar för att driva turneringen framåt. Samtliga spelar
		dessutom aktivt i turneringen, klicka gärna på respektive namn för att läsa mer om deras
		prestationer och bidrag!
	</p>

	<div class="mt-6 flex flex-wrap justify-center gap-4">
		{#each heads as head}
			<div class="rounded-2xl bg-gray-100 p-5 text-center dark:bg-gray-900">
				<img class="mb-4 size-42 rounded-full object-cover" src={head.image} alt={head.name} />

				<a
					class="text-xl font-semibold text-gray-900 hover:underline dark:text-gray-100"
					href="/spelare/{head.battletag.replace('#', '-')}">{head.name}</a
				>
				<p class="font-medium text-gray-500 dark:text-gray-300">{head.subtitle}</p>
			</div>
		{/each}
	</div>

	<p class="mx-auto mt-10 max-w-2xl">
		Om du har frågor eller funderingar, eller vill komma i kontakt med oss, tveka inte att höra av
		dig på mail: <a class="underline" href="mailto:dunderleagueow@gmail.com"
			>dunderleagueow@gmail.com</a
		>. Du kan dessutom nå ledningens medlemmar direkt på Discord.
	</p>
</PageSection>
