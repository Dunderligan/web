<script lang="ts">
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import Icon from '../ui/Icon.svelte';
	import StatusIndicator from '../ui/StatusIndicator.svelte';

	type Props = {
		slot: MatchSlot;
		class?: ClassValue;
	};

	let { slot, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const members = $derived(slot === MatchSlot.A ? context.teamAMembers : context.teamBMembers);
</script>

<div class={[classProp, 'space-y-1']}>
	{#each members as { member, profile } (member.player.id)}
		{@const presence = context.presenceFor(member.player.battletag)}
		{@const connected = presence !== null}

		<div class="flex h-12 items-center gap-1.5 rounded-lg bg-gray-100 p-2 dark:bg-gray-900">
			{#if profile.status === 'found' && profile.profile.avatarUrl}
				<img src={profile.profile.avatarUrl} alt="Profilbild" class="h-full rounded-md" />
			{/if}

			<span class="mr-auto text-lg font-semibold">
				{member.player.battletag.split('#')[0]}
			</span>

			{#if member.isCaptain}
				<Icon icon="ph:crown-simple" title="Lagkapten" />
			{/if}

			<StatusIndicator
				size="sm"
				kind={connected ? 'active' : 'inactive'}
				title={connected ? 'Ansluten' : 'Frånkopplad'}
			/>
		</div>
	{/each}
</div>
