<script lang="ts" generics="M extends { player: { id: string } }">
	import type { PlayerCheckin, Roster } from '$lib/types';
	import Progress from '../ui/Progress.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import AdminLinkList from './AdminLinkList.svelte';

	type Props = {
		rosters: (Roster & { members: M[] })[];
		showCheckins?: boolean;
		checkins?: Map<string, PlayerCheckin>;
		// AdminLinkList props
		oncreateclick?: () => void;
		emptyText: string;
		hideCreateButton?: boolean;
	};

	let { rosters, showCheckins, checkins = new Map(), ...adminLinkListProps }: Props = $props();
</script>

<AdminLinkList
	items={rosters}
	itemKey={(roster) => roster.id}
	linkHref={(roster) => `/admin/roster/${roster.id}`}
	{...adminLinkListProps}
>
	{#snippet linkContent({ item: roster })}
		<RosterLogo id={roster.id} class="mr-2 inline size-12" />

		<div class="grow pr-4">
			<div>{roster.name}</div>

			{#if showCheckins}
				{@const totalCount = roster.members.length}
				{@const checkedInCount = roster.members.filter((member) =>
					checkins.has(member.player.id)
				).length}

				<Progress
					label="Incheck:"
					value={checkedInCount}
					max={totalCount}
					color={checkedInCount === totalCount ? 'green' : 'accent'}
					inline
				/>
			{/if}
		</div>
	{/snippet}
</AdminLinkList>
