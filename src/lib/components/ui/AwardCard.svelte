<script lang="ts">
	import type { AwardType, PlayerAward } from '$lib/types';
	import medal from '$lib/assets/images/medal.png';
	import awardBackground from '$lib/assets/images/award-background.jpg';

	type Props = {
		type: AwardType;
		awards: PlayerAward[];
	};

	let { type, awards }: Props = $props();
</script>

<div class="relative min-h-40 max-w-lg rounded-lg bg-gray-100 py-4">
	<div
		class="relative flex w-full items-center justify-between overflow-hidden bg-accent-600 py-3 pr-4 pl-28 text-xl font-bold text-white"
	>
		<span class="z-10">
			{type.name}
		</span>

		{#if awards.length > 1}
			<span class="z-10">
				x{awards.length}
			</span>
		{/if}

		<img class="absolute inset-0 mix-blend-overlay" src={awardBackground} alt="Medal" />
	</div>

	<div class="mt-2 ml-28 font-semibold text-gray-700">
		{#each awards as award (award.id)}
			{#if award.division}
				<div>
					{award.division.name}, {award.division.season.name}
				</div>
			{/if}
		{/each}
	</div>

	<img class="absolute -top-1 -left-4 w-36" src={medal} alt="Medal" />
</div>
