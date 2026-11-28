<script lang="ts">
	import Dialog from './Dialog.svelte';

	type Props = {
		open: boolean;
		legacy?: boolean;
	};

	let { open = $bindable(), legacy }: Props = $props();

	const tiebreakers = $derived.by(() => {
		if (legacy) {
			return ['Färst förlorade kartor', 'Flest vunna matcher', 'Startseed'];
		}

		return [
			'Flest oavgjorda kartor',
			'Flest vunna matcher',
			'Inbördesmöten',
			'Högre sammanlagd antal vunna kartor för motståndare',
			'Högre sammanlagt antal oavgjorda kartor för motståndare',
			'Det lag som vunnit mot högst seedat lag',
			'Det lag som förlorat mot högst seedat lag',
			'Startseed'
		];
	});
</script>

<Dialog bind:open title="Tiebreakers" wide>
	{#snippet description()}
		<p>
			För att avgöra seeding i slutspelet rankas lagen efter antal samlade poäng, d.v.s. antalet
			vunna kartor. I vissa säsonger används dessutom seeding för att bestämma vilka lag som går
			vidare från gruppspelet.
		</p>

		<p>Ifall flera lag har samma poäng används följande tiebreakers, i ordning:</p>

		<ol>
			{#each tiebreakers as tiebreaker, i (i)}
				<li>
					<span class="font-semibold">{i + 1}.</span>
					<span>{tiebreaker}</span>
				</li>
			{/each}
		</ol>
	{/snippet}
</Dialog>
