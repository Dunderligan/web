<script lang="ts">
	import PickBan from '$lib/components/pick-ban/PickBan.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
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

<PageSection topMargin={false} wide>
	<div class="flex items-center gap-2">
		<Button kind="secondary" icon="ph:arrow-left" href="/pick-ban" label="Tillbaka" />
		<Button kind="secondary" icon="ph:info" label="Info" />

		<Chip class="ml-auto" {...connectionChipProps} />
	</div>

	<PickBan class="mt-4" />
</PageSection>
