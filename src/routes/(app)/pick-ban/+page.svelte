<script lang="ts">
	import { resolve } from '$app/paths';
	import Match from '$lib/components/match/Match.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';

	let { data } = $props();
</script>

<PageSection>
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
					<span class="text-sm text-gray-300">{room.status}</span>
				</div>
				<Match match={room.match} />
			</a>
		{/each}
	</div>
</PageSection>
