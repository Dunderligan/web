<script lang="ts">
	import type { AwardType, PlayerAward } from '$lib/types';
	import { flattenDivision } from '$lib/util';
	import Link from './Link.svelte';
	import Popover from './Popover.svelte';
	import AwardTypeLogo from './AwardTypeLogo.svelte';

	type Props = {
		type: AwardType;
		award: PlayerAward;
	};

	let { type, award }: Props = $props();

	const shownDivision = $derived(type.showDivision ? award.division : null);
</script>

<Popover class="relative">
	<AwardTypeLogo {type} />

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
		<div class="max-w-2xs pt-30 text-center">
			<div
				class="absolute top-0 left-0 flex h-30 w-full items-center justify-center bg-linear-to-b from-accent-600 to-accent-700 dark:from-accent-800 dark:to-accent-900"
			>
				<AwardTypeLogo {type} class="medal-spin size-20" />
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
	:global(.medal-spin) {
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
