<script lang="ts">
	import {
		buildBracketLayout,
		INFO_ROW_HEIGHT,
		LINE_WIDTH,
		MATCH_HEIGHT,
		MATCH_SLOT_HEIGHT,
		MATCH_WIDTH,
		orderEdgesForPainting
	} from '$lib/bracket/layout';
	import type { BracketFormat, ResolvedMatchWithSeeds } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		class?: ClassValue;
		matches: ResolvedMatchWithSeeds[];
		seasonSlug: string;
		format: BracketFormat;
	};

	let { class: classProp, matches, seasonSlug, format }: Props = $props();

	let hoveredRosterId = $state<string | null>(null);

	const layout = $derived(buildBracketLayout(matches, format));

	const edges = $derived(orderEdgesForPainting(layout.edges, hoveredRosterId));
</script>

<div
	class={[classProp, 'bracket relative']}
	style="width: {layout.width}px; height: {layout.height}px; --info-row-height: {INFO_ROW_HEIGHT}px; --line-width: {LINE_WIDTH}px; --slot-height: {MATCH_SLOT_HEIGHT}px; --match-width: {MATCH_WIDTH}px; --match-height: {MATCH_HEIGHT}px"
>
	<svg
		class="pointer-events-none absolute inset-0"
		width={layout.width}
		height={layout.height}
		aria-hidden="true"
	>
		{#each edges as { edge, highlighted } (edge.from.match.id + edge.to.match.id)}
			<path d={edge.path} class={['bracket-edge', highlighted && 'highlighted']} />
		{/each}
	</svg>

	{#each layout.nodes as node (node.match.id)}
		{#if node.visible}
			<div class="absolute" style="left: {node.x}px; top: {node.y}px">
				<BracketMatch {seasonSlug} match={node.match} bind:hoveredRosterId />
			</div>
		{/if}
	{/each}
</div>

<style>
	.bracket-edge {
		fill: none;
		stroke: var(--color-gray-100);
		stroke-width: 2px;
		stroke-linejoin: round;
	}

	.bracket-edge.highlighted {
		stroke: var(--color-gray-300);
	}

	:global(.dark) .bracket-edge {
		stroke: var(--color-gray-900);
	}

	:global(.dark) .bracket-edge.highlighted {
		stroke: var(--color-gray-800);
	}
</style>
