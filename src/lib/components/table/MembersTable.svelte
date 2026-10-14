<script lang="ts">
	import type { Member } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import { capitalize, roleIcon } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import Rank from '../ui/Rank.svelte';
	import NewTable from './NewTable.svelte';
	import Link from '../ui/Link.svelte';

	type Props = {
		members: Member[];
		class?: ClassValue;
	};

	let { members, class: classProp }: Props = $props();
</script>

{#snippet roleCell({ role }: Member)}
	<Icon class="text-xl" icon={roleIcon(role)} title={capitalize(role)} />
{/snippet}

{#snippet battletagCell({ player, isCaptain, registeredName }: Member)}
	{@const shownName =
		registeredName ?? (isCaptain ? player.battletag : player.battletag.split('#')[0])}

	<Link
		class="text-lg font-semibold"
		href="/spelare/{player.battletag.replace('#', '-')}"
		title={player.battletag}>{shownName}</Link
	>

	{#if isCaptain}
		<Icon icon="ph:crown-simple" class="ml-2" title="Lagkapten" />
	{/if}
{/snippet}

{#snippet rankCell({ rank, tier, sr }: Member)}
	{#if rank && tier}
		<Rank rank={{ rank, tier }} collapse />
	{:else if sr}
		<Rank rank={{ sr }} collapse />
	{/if}
{/snippet}

<NewTable
	columns={[
		{ label: 'Roll', snippet: roleCell, center: true },
		{
			label: 'Battletag',
			snippet: battletagCell
		},
		{
			label: 'Rank',
			snippet: rankCell
		}
	]}
	rows={members}
	key={(member) => member.player.battletag}
	class={classProp}
/>
