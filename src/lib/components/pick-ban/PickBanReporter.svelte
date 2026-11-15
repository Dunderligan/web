<script lang="ts">
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { ClassValue } from 'svelte/elements';
	import Subheading from '../ui/Subheading.svelte';
	import { matchRoster, matchSlots } from '$lib/match';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Button from '../ui/Button.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const MAP_LENGTH_THRESHOLD = 1000 * 60 * 3; // 3 minutes;

	const timeSinceMapStart = $derived(context.now.getTime() - context.state.updatedAt.getTime());
</script>

<div class={classProp}>
	{#if timeSinceMapStart < MAP_LENGTH_THRESHOLD}
		<Subheading>Dags att spela!</Subheading>

		{#if context.userIsCaptain}
			<p class="font-medium text-gray-600 dark:text-gray-400">
				Kom tillbaka hit efter kartan för att rapportera resultatet. Lycka till!
			</p>
		{/if}
	{:else}
		<Subheading>Rapportera resultatet</Subheading>

		<div class={[classProp, 'mt-2 flex w-full max-w-md flex-col gap-1 overflow-hidden']}>
			{#each matchSlots() as slot (slot)}
				{@const roster = matchRoster(context.match, slot)}

				{#if roster}
					<Button class="justify-start text-lg" kind="secondary">
						<RosterLogo id={roster.id} size="md" />
						<span class="font-semibold">
							{roster.name}
						</span>
					</Button>
				{/if}
			{/each}

			<Button kind="tertiary" icon="ph:handshake" label="Oavgjort" />
		</div>
	{/if}
</div>
