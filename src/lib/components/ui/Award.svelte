<script lang="ts">
	import type { AwardType, PlayerAward } from '$lib/types';
	import fallbackIcon from '$lib/assets/images/placeholder.avif';
	import { flattenDivision } from '$lib/util';
	import Link from './Link.svelte';
	import Popover from './Popover.svelte';

	type Props = {
		type: AwardType;
		award: PlayerAward;
	};

	let { type, award }: Props = $props();

	const shownDivision = $derived(type.showDivision ? award.division : null);
	const icon = $derived(type.imageUrl ?? fallbackIcon);
</script>

<Popover class="relative rounded-full shadow-md dark:brightness-85">
	<img src={icon} alt={type.name} class="h-full w-full object-cover" />

	{#if shownDivision}
		{@const { season } = flattenDivision(shownDivision)}
		{@const seasonNumber = season.name.split(' ').at(-1) ?? season.name}

		<div
			class="absolute right-0 bottom-0 transform rounded-md bg-accent-600 px-2 py-0.5 text-sm font-semibold text-white"
		>
			S{seasonNumber}
		</div>
	{/if}

	{#snippet content()}
		<div class="max-w-2xs pt-32 text-center">
			<div
				class="absolute top-0 left-0 flex h-32 w-full items-center justify-center bg-linear-to-b from-accent-700 to-accent-800 dark:from-accent-800 dark:to-accent-900"
			>
				<img
					src={icon}
					alt={type.name}
					class="medal-spin size-20 rounded-full object-cover shadow-lg"
				/>
			</div>

			<h3 class="font-display text-xl font-bold">
				{type.name}
			</h3>

			{#if shownDivision}
				{@const { division, season } = flattenDivision(shownDivision)}

				<h4>
					<Link href="/stallningar/{season.slug}?div={division.slug}">
						{division.name}, {season.name}
					</Link>
				</h4>
			{/if}

			{#if award.motivation}
				<p class="mt-2 text-sm whitespace-pre-line">
					"{award.motivation}"
				</p>
			{/if}

			{#if type.description}
				<p class="mt-2 text-sm whitespace-pre-line">
					{type.description}
				</p>
			{/if}
		</div>
	{/snippet}
</Popover>

<style>
	.medal-spin {
		animation: spin 0.8s cubic-bezier(0.5, 1, 0.89, 1);
	}

	@keyframes spin {
		0% {
			transform: rotateY(180deg);
		}
		100% {
			transform: rotateY(0deg);
		}
	}
</style>
