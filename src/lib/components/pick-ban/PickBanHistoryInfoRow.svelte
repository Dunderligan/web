<script lang="ts">
	import { resolve } from '$app/paths';
	import { matchRoster } from '$lib/match';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { formatDateTime, formatTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import Link from '../ui/Link.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Tooltip from '../ui/Tooltip.svelte';
	import type { HistoryEntry } from './PickBanHistory.svelte';

	type Props = {
		entry: HistoryEntry;
	};

	let { entry }: Props = $props();

	const context = PickBanContext.get();
</script>

{#snippet separator()}
	<span class="h-4 w-px bg-gray-300 dark:bg-gray-700" aria-hidden="true"></span>
{/snippet}

<div
	class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-600 dark:text-gray-400"
>
	{#if entry.kind === 'decision'}
		{@const roster = matchRoster(context.match, entry.decision.slot)}

		{@const actor = entry.decision.actor}
		{@const member = actor ? context.findMemberByBattletag(actor.battletag)?.member : null}

		{#if roster}
			{@const rosterHref = resolve(`/lag/${roster?.slug}/${context.seasonSlug}`)}

			<RosterLogo id={roster.id} size={20} href={rosterHref} />

			<Link href={rosterHref}>
				{roster.name}
			</Link>
		{/if}

		{@render separator()}

		{#if entry.decision.automatic}
			<Icon icon="ph:robot" class="text-base" />
			<span>Automatiskt</span>
		{:else if member}
			{@const avatarUrl =
				member.profile.status === 'found' ? member.profile.profile.avatarUrl : null}
			{@const battletag = member.member.player.battletag}
			{@const href = resolve(`/spelare/${battletag.replace('#', '-')}`)}

			{#if avatarUrl}
				<img src={avatarUrl} alt="" class="size-5 rounded object-cover" />
			{/if}

			<Link {href}>
				{battletag.split('#')[0]}
			</Link>
		{/if}

		{@render separator()}
	{/if}

	{#if entry.at}
		<Tooltip underline>
			{#snippet content()}
				<p class="text-lg font-medium">
					{formatDateTime(entry.at!)}
				</p>
			{/snippet}
			{formatTime(entry.at)}
		</Tooltip>
	{/if}
</div>
