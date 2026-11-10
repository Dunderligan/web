<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Match from '$lib/components/match/Match.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { createRoom } from '$lib/remote/pick-ban.remote.js';

	let { data } = $props();

	async function create() {
		await createRoom({
			matchId: '9df7e3a3-638b-475d-9f48-43a168071fc0'
		});
		await invalidateAll();
	}
</script>

<PageSection>
	<Button onclick={create}>Skapa</Button>

	<div class="space-y-1">
		{#each data.rooms as room (room.id)}
			<a
				href={resolve(`/pick-ban/${room.id}`)}
				class="flex items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-800 p-2 font-medium"
			>
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-300">{room.id}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-300">{room.state}</span>
				</div>
				<Match match={room.match} />
			</a>
		{/each}
	</div>
</PageSection>
