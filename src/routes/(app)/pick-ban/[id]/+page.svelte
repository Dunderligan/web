<script lang="ts">
	import PickBan from '$lib/components/pick-ban/PickBan.svelte';
	import PickBanInfoDialog from '$lib/components/pick-ban/PickBanInfoDialog.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import { matchDivision } from '$lib/match.js';
	import { RoomStatus } from '$lib/pick-ban/types.js';
	import { PickBanContext } from '$lib/state/pick-ban.svelte.js';
	import type { ChipColor } from '$lib/types.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	PickBanContext.set(
		new PickBanContext({
			catalog: { maps: data.maps, heroes: data.heroes },
			gamemodes: data.gamemodes,
			config: data.config,
			initialState: data.state,
			match: data.match,
			roomId: data.roomId,
			teamAMembers: data.teamAMembers,
			teamBMembers: data.teamBMembers,
			user: data.user
		})
	);

	const context = PickBanContext.get();

	let infoOpen = $state(false);

	const rosterA = $derived(context.match.rosterA);
	const rosterB = $derived(context.match.rosterB);
	const division = $derived(matchDivision(context.match));
	const season = $derived(division?.season);

	const connectionChipProps = $derived(
		{
			connected: { color: 'green' as ChipColor, label: 'Ansluten', icon: 'ph:circle' },
			loading: { color: 'yellow' as ChipColor, label: 'Ansluter...', icon: 'ph:spinner' },
			disconnected: { color: 'red' as ChipColor, label: 'Inte ansluten', icon: 'ph:minus-circle' }
		}[context.connectionState]
	);

	onMount(() => {
		const destroy = context.startClient();
		return destroy;
	});
</script>

<Meta
	title="{rosterA?.name} vs {rosterB?.name}"
	description="Se kartval och hjältebans för {division?.name}, {season?.name}."
/>

<PageSection topMargin={false} wide>
	<div class="flex items-center gap-2">
		<Button kind="secondary" icon="ph:arrow-left" href="/pick-ban" label="Tillbaka" />
		<Button kind="secondary" icon="ph:info" label="Info" onclick={() => (infoOpen = true)} />

		{#if context.status !== RoomStatus.CANCELLED && context.status !== RoomStatus.FINISHED}
			<Chip class="ml-auto" {...connectionChipProps} />
		{/if}
	</div>

	<PickBan class="mt-4" />
</PageSection>

<PickBanInfoDialog bind:open={infoOpen} />
