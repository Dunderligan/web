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

<div class="relative min-h-40 rounded-lg bg-gray-100 pt-4 pb-6 dark:bg-gray-900">
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

	<div class="mt-4 ml-30 font-medium text-gray-700 dark:text-gray-300">
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
