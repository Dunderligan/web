<script lang="ts">
	import RoomCard from '$lib/components/pick-ban/RoomCard.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';

	let { data } = $props();
</script>

<Meta title="Pick-ban" />

<PageHeader title="Pick-ban" />

<PageSection>
	<Subheading class="mb-2">Aktiva rum</Subheading>

	<div class="space-y-1">
		{#each data.rooms as room (room.id)}
			<RoomCard {room} />
		{/each}
	</div>

	<Subheading class="mt-8 mb-2">Tidigare rum</Subheading>
</PageSection>
