<script lang="ts">
	import PageSection from '$lib/components/structure/PageSection.svelte';

	let { data } = $props();
</script>

<PageSection>
	<h1 class="text-2xl font-bold">Room: {data.room.id}</h1>
	<p>State: {data.room.state}</p>

	<details class="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4" open>
		<summary class="cursor-pointer font-medium text-white">All room data</summary>
		<pre class="mt-3 overflow-x-auto text-sm whitespace-pre-wrap text-gray-300">{JSON.stringify(
				data.room,
				null,
				2
			)}</pre>
	</details>
</PageSection>
