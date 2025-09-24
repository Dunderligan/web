<script lang="ts">
	import type { Member } from '$lib/types';
	import { capitalize, roleIcon } from '$lib/util';
	import Icon from './Icon.svelte';
	import Rank from './Rank.svelte';
	import Table from './Table.svelte';

	type Props = {
		members: Member[];
	};

	let { members }: Props = $props();
</script>

<Table
	columns={[
		{
			label: 'Roll',
			center: true
		},
		{
			label: 'Battletag'
		},
		{ label: 'Rank' }
	]}
	rows={members}
	class="grid-cols-[70px_1fr_170px]"
>
	{#snippet row({ value: { player, role, rank, tier, isCaptain } })}
		<div class="bg-gray-200 py-3.5 text-center text-xl text-gray-800">
			<Icon icon={roleIcon(role)} title={capitalize(role)} />
		</div>

		<div class="flex items-center bg-gray-200 text-lg font-semibold">
			{player.battletag}

			{#if isCaptain}
				<Icon icon="mdi:crown" class="mb-0.5 ml-2 text-gray-800" title="Lagkapten" />
			{/if}
		</div>

		<div class="flex items-center bg-gray-200 text-lg font-medium">
			<Rank {rank} {tier} />
		</div>
	{/snippet}
</Table>
