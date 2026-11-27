<script lang="ts">
	import { PickBanContext } from '#lib/state/pick-ban.svelte.ts';
	import { MatchSlot } from '#lib/types.ts';
	import type { ClassValue } from 'svelte/elements';
	import Icon from '../ui/Icon.svelte';
	import StatusIndicator from '../ui/StatusIndicator.svelte';
	import Link from '../ui/Link.svelte';
	import { resolve } from '$app/paths';
	import { RoomStatus } from '#lib/pick-ban/index.ts';

	type Props = {
		slot: MatchSlot;
		class?: ClassValue;
	};

	let { slot, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const members = $derived(slot === MatchSlot.A ? context.teamAMembers : context.teamBMembers);
	const showStatus = $derived(
		context.status === RoomStatus.OPEN || context.status === RoomStatus.IN_PROGRESS
	);
</script>

<div class={[classProp, 'space-y-1']}>
	{#each members as { member, profile } (member.player.id)}
		{@const battletag = member.player.battletag}
		{@const href = resolve(`spelare/${battletag.replace('#', '-')}`)}

		{@const presence = context.presenceFor(battletag)}
		{@const connected = presence !== null}

		<div
			class="flex h-12 items-center gap-1.5 overflow-hidden rounded-lg bg-gray-100 p-2 dark:bg-gray-900"
		>
			{#if profile.status === 'found' && profile.profile.avatarUrl}
				<img src={profile.profile.avatarUrl} alt="Profilbild" class="h-full rounded-md" />
			{/if}

			<Link {href} class="mr-auto truncate text-lg font-semibold">
				{battletag.split('#')[0]}
			</Link>

			{#if member.isCaptain}
				<Icon icon="ph:crown-simple" title="Lagkapten" />
			{/if}

			{#if showStatus}
				<StatusIndicator
					size="sm"
					kind={connected ? 'active' : 'inactive'}
					title={connected ? 'Ansluten' : 'Frånkopplad'}
				/>
			{/if}
		</div>
	{/each}
</div>
