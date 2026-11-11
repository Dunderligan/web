<script lang="ts">
	import PickBan from '$lib/components/pick-ban/PickBan.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import { subscribeToRoom } from '$lib/remote/pick-ban.remote.js';

	let { data } = $props();

	const stateQuery = $derived(subscribeToRoom({ roomId: data.roomId }));
</script>

<PageSection topMargin={false} wide>
	{#await stateQuery}
		<div>Loading...</div>
	{:then state}
		<div class="flex items-center gap-2">
			<Button kind="secondary" icon="ph:arrow-left" href="/pick-ban" label="Tillbaka" />
			<Button kind="secondary" icon="ph:info" label="Info" />

			<Chip
				class="ml-auto"
				icon="ph:circle"
				color={stateQuery.connected ? 'green' : 'gray'}
				label={stateQuery.connected ? 'Ansluten' : 'Inte ansluten'}
			/>
		</div>

		<PickBan
			{state}
			catalog={{ maps: data.maps, heroes: data.heroes }}
			match={data.match}
			config={data.config}
			teamAMembers={data.teamAMembers}
			teamBMembers={data.teamBMembers}
			class="mt-4"
		/>
	{/await}
</PageSection>
