<script lang="ts">
	import type { AwardType, PlayerAward } from '$lib/types';
	import medal from '$lib/assets/images/medal.png';

	type Props = {
		type: AwardType;
		awards: PlayerAward[];
	};

	let { type, awards }: Props = $props();

	const COLLAPSED_MAX_COUNT = 3;

	let expanded = $state(false);

	const canExpand = $derived(awards.length > COLLAPSED_MAX_COUNT);
	const shownAwards = $derived(expanded ? awards : awards.slice(0, COLLAPSED_MAX_COUNT));
</script>

<div
	class="relative min-h-40 rounded-lg bg-gray-100 py-4 font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
>
	<div
		class="banner flex items-center gap-4 overflow-hidden py-3 pr-4 pl-30 text-xl font-bold text-white"
	>
		<span>
			{type.name}
		</span>

		{#if awards.length > 1}
			<span>
				x{awards.length}
			</span>
		{/if}
	</div>

	{#if awards[0].description}
		<div class="relative mt-4 mr-4 ml-30 min-h-16 resize-y overflow-hidden whitespace-pre-line">
			<p class="text-sm">Motivering:</p>

			<p>"{awards[0].description}"</p>

			<div
				class="absolute right-0 bottom-0 left-0 h-6 bg-linear-to-t from-gray-100 to-transparent"
			></div>
		</div>
	{/if}

	<div class="mt-4 ml-30">
		{#each shownAwards as award (award.id)}
			{#if award.division}
				<div>
					{award.division.name}, {award.division.season.name}
				</div>
			{/if}
		{/each}

		{#if canExpand && !expanded}
			<button onclick={() => (expanded = true)} class="block hover:underline">
				...och {awards.length - COLLAPSED_MAX_COUNT} fler</button
			>
		{/if}
	</div>

	<img class="absolute -top-1 -left-4 w-36" src={medal} alt="Medal" />
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
