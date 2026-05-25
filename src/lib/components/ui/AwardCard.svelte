<script lang="ts">
	import type { AwardType, PlayerAward } from '$lib/types';
	import medal from '$lib/assets/images/medal.png';
	import Icon from './Icon.svelte';

	type Props = {
		type: AwardType;
		awards: PlayerAward[];
	};

	let { type, awards }: Props = $props();

	const COLLAPSED_MAX_COUNT = 3;

	let expandedAwards = $state(false);

	const canExpandAwards = $derived(awards.length > COLLAPSED_MAX_COUNT);
	const shownAwards = $derived(expandedAwards ? awards : awards.slice(0, COLLAPSED_MAX_COUNT));

	let expandedDescription = $state(false);

	const description = $derived(awards.at(0)?.description ?? null);
	const canExpandDescription = $derived(description !== null && description.split('\n').length > 3);
</script>

<div
	class="relative min-h-40 rounded-lg bg-gray-100 py-4 font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
>
	<img class="absolute -top-1 -left-4 w-36 drop-shadow-sm" src={medal} alt="Medal" />

	<div
		class="banner flex items-center gap-4 overflow-hidden py-3 pr-4 pl-30 text-xl font-bold text-white"
	>
		<div>
			{type.name}
		</div>

		{#if awards.length > 1}
			<div>
				x{awards.length}
			</div>
		{/if}
	</div>

	<div class="mt-4 mr-4 ml-30">
		{#if description}
			<div class={[!expandedDescription && 'line-clamp-3', 'relative whitespace-pre-line']}>
				<p class="text-sm">Motivering:</p>

				<p>"{description}"</p>

				{#if canExpandDescription && !expandedDescription}
					<div
						class="absolute right-0 bottom-0 left-0 h-6 bg-linear-to-t from-gray-100 to-transparent dark:from-gray-900"
					></div>
				{/if}
			</div>

			{#if canExpandDescription && !expandedDescription}
				<button
					onclick={() => (expandedDescription = true)}
					class="mt-1 block font-semibold hover:underline"
				>
					Läs mer
				</button>
			{/if}
		{/if}

		{#each shownAwards as award (award.id)}
			{#if award.division}
				<div>
					{award.division.name}, {award.division.season.name}
				</div>
			{/if}
		{/each}

		{#if canExpandAwards && !expandedAwards}
			<button
				onclick={() => (expandedAwards = true)}
				class="mt-1 block font-semibold hover:underline"
			>
				...och {awards.length - COLLAPSED_MAX_COUNT} fler</button
			>
		{/if}
	</div>
</div>

<style>
	.banner {
		background-image:
			url('$lib/assets/images/award-background.webp'), linear-gradient(var(--color-accent-600));
		background-size: cover;
		background-position: top;
		background-blend-mode: overlay, normal;
	}
</style>
