<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import { RosterState } from '$lib/state/rosters.svelte.js';
	import { deleteGroup } from './page.remote.js';

	const { data } = $props();

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

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: group.name, href: `/admin/grupp/${group.id}` }
	]}
/>

<AdminCard title="Lag">
	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each group.rosters as { id, name, slug } (id)}
			<AdminLink href="/admin/roster/{id}">
				<RosterLogo {id} class="mr-2 inline size-10" />
				{name}</AdminLink
			>
		{/each}
	</div>
</AdminCard>

<AdminCard title="Inställningar">
	<Button icon="mdi:trash-can" label="Radera grupp" kind="negative" onclick={submitDelete} />
</AdminCard>
