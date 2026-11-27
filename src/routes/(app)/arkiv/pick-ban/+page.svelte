<script lang="ts">
	import RoomCard from '$lib/components/pick-ban/RoomCard.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';

	let { data } = $props();
</script>

<Meta title="Pick-ban arkiv" />

<PageHeader title="Pick-ban arkiv" />

<PageSection>
	<Button href="/pick-ban" kind="secondary" icon="ph:arrow-left" label="Till aktiva rum" />

	<div class="mt-4 space-y-1">
		{#each data.rooms as room (room.id)}
			<RoomCard {room} />
		{:else}
			<Placeholder icon="ph:magnifying-glass" text="Inga arkiverade rum hittades" />
		{/each}
	</div>
</PageSection>
