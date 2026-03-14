<script lang="ts">
	import type { ClassValue, Member } from '$lib/types';
	import { capitalize, roleIcon } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import Rank from '../ui/Rank.svelte';
	import Table from './Table.svelte';

	type Props = {
		members: Member[];
		class?: ClassValue;
	};

	let { members, class: classProp }: Props = $props();
</script>

<Table
	columns={[
		{ label: 'Roll', center: true },
		{
			label: 'Battletag'
		},
		{
			label: 'Rank'
		}
	]}
	rows={members}
	key={(member) => member.player.battletag}
	class={[classProp, 'grid-cols-[60px_1fr_100px] sm:grid-cols-[70px_1fr_220px]']}
>
	{#snippet row({ value: { player, role, rank, sr, tier, isCaptain } })}
		<div class="py-3.5 text-center text-xl">
			<Icon icon={roleIcon(role)} title={capitalize(role)} />
		</div>

		<div class="flex items-center text-lg font-semibold">
			<a href="/spelare/{player.battletag.replace('#', '-')}" class="hover:underline">{player.battletag}</a>

			{#if isCaptain}
				<Icon icon="ph:crown-simple" class="mb-0.5 ml-2" title="Lagkapten" />
			{/if}
		</div>

		<div class="flex items-center font-medium">
			{#if rank && tier}
				<Rank rank={{ rank, tier }} collapse />
			{:else if sr}
				<Rank rank={{ sr }} collapse />
			{/if}
		</div>
	{/snippet}
</Table>
