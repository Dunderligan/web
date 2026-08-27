<script lang="ts">
	import type { Member } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import { capitalize, roleIcon } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import Rank from '../ui/Rank.svelte';
	import Table from './Table.svelte';
	import Link from '../ui/Link.svelte';

	type Props = {
		members: Member[];
		class?: ClassValue;
	};

	let { members, class: classProp }: Props = $props();
</script>

<Table
	columns={[
		{ label: 'Roll', center: true, width: 'min-content' },
		{
			label: 'Battletag'
		},
		{
			label: 'Rank'
		}
	]}
	rows={members}
	key={(member) => member.player.battletag}
	class={classProp}
>
	{#snippet row({ value: { player, role, rank, sr, tier, isCaptain, registeredName } })}
		{@const shownName =
			registeredName ?? (isCaptain ? player.battletag : player.battletag.split('#')[0])}

		<div class="justify-center text-xl">
			<Icon icon={roleIcon(role)} title={capitalize(role)} />
		</div>

		<div class="text-lg font-semibold">
			<Link href="/spelare/{player.battletag.replace('#', '-')}" title={player.battletag}
				>{shownName}</Link
			>

			{#if isCaptain}
				<Icon icon="ph:crown-simple" class="mb-0.5 ml-2" title="Lagkapten" />
			{/if}
		</div>

		<div>
			{#if rank && tier}
				<Rank rank={{ rank, tier }} collapse />
			{:else if sr}
				<Rank rank={{ sr }} collapse />
			{/if}
		</div>
	{/snippet}
</Table>
