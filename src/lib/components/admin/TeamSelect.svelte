<script lang="ts">
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { queryTeams } from '$lib/remote/team.remote';
	import type { ComponentProps } from 'svelte';
	import SearchSelect from '../form/SearchSelect.svelte';
	import type { RosterWithGroup, SelectItem } from '$lib/types';

	type Props = {
		excludeSeasonId?: string;
		excludeTeamId?: string;
		onTeamChanged?: (value: { teamId: string; rosters: RosterWithGroup[] } | undefined) => void;
	} & Omit<ComponentProps<typeof SearchSelect>, 'queryItems'>;

	let {
		excludeSeasonId,
		excludeTeamId,
		value = $bindable(),
		placeholder = 'Sök efter lag...',
		noResultsText = 'Inga lag hittades',
		onTeamChanged,
		onValueChange,
		...props
	}: Props = $props();

	let rostersByTeamId: Map<string, RosterWithGroup[]> = $state(new Map());

	async function queryItems(query: string): Promise<SelectItem[]> {
		const results = await queryTeams({ query, excludeSeasonId, excludeTeamId });

		rostersByTeamId = results;

		return results
			.entries()
			.map(([teamId, rosters]) => ({
				label: rosters.at(0)?.name ?? 'Okänt lag',
				value: teamId
			}))
			.toArray();
	}

	function handleValueChange(teamId: string | undefined) {
		if (teamId) {
			const rosters = rostersByTeamId.get(teamId) ?? [];
			onTeamChanged?.({ teamId, rosters });
		} else {
			onTeamChanged?.(undefined);
		}
		onValueChange?.(teamId);
	}
</script>

<SearchSelect
	bind:value
	{queryItems}
	{placeholder}
	{noResultsText}
	onValueChange={handleValueChange}
	{...props}
>
	{#snippet itemSnippet({ value })}
		{@const rosters = rostersByTeamId.get(value) ?? []}

		<div class="space-y-1">
			{#each rosters as roster (roster.id)}
				<div class="flex w-full items-center">
					<RosterLogo id={roster.id} size="sm" class="mr-3" />
					<div>
						<div>
							{roster.name}
						</div>
						<div class="text-sm">
							{roster.group.division.season.name}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</SearchSelect>
