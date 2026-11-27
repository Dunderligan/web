<script lang="ts">
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import RoomCard from '$lib/components/pick-ban/RoomCard.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Note from '$lib/components/ui/Note.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';

	let { data } = $props();
</script>

<Meta title="Pick-ban" />

<PageHeader title="Pick-ban" />

<PageSection>
	<Subheading class="mb-2">
		Aktiva rum

		<Note class="inline" content="Rum skapas automatiskt 15 minuter innan planerad matchstart." />
	</Subheading>

	<div class="space-y-1">
		{#each data.rooms as room (room.id)}
			<RoomCard {room} />
		{:else}
			<Placeholder icon="ph:magnifying-glass" text="Inga aktiva rum hittades" />
		{/each}
	</div>

	<AdminLink href="/arkiv/pick-ban" class="mt-8" rounded>Se arkiverade rum</AdminLink>
</PageSection>
