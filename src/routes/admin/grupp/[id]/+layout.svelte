<script lang="ts">
	import { goto } from '$app/navigation';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import { RosterState } from '$lib/state/rosters.svelte.js';
	import { deleteGroup } from './layout.remote.js';

	const { data, children } = $props();

	const { season, division, group } = $derived(data);

	RosterState.set(new RosterState(data.group.rosters));

	async function submitDelete() {
		await deleteGroup({
			id: group.id
		});

		await goto(`/admin/division/${division.id}`);
	}
</script>

<EditMatchDialog />

<div class="space-y-6">
	<a class="text-xl font-semibold" href="/admin/sasong/{season.id}">{season.name}</a>
	<span> - </span>
	<a class="text-xl font-semibold" href="/admin/division/{division.id}">{division.name}</a>
	<h1 class="text-4xl font-bold">{group.name}</h1>

	<div>
		<a href="lag">Lag</a>
		<a href="gruppspel">Gruppspel</a>
	</div>

	{@render children()}

	<button onclick={submitDelete}>Radera grupp</button>
</div>
