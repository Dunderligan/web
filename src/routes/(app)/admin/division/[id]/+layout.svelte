<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteDivision } from './layout.remote';

	const { data, children } = $props();

	const { division } = $derived(data);
	const { season } = $derived(division);

	async function submitDelete() {
		await deleteDivision({
			id: division.id
		});

		await goto(`/admin/sasong/${season.id}`);
	}
</script>

<div class="space-y-6">
	<a class="text-xl font-semibold" href="/admin/sasong/{season.id}">{season.name}</a>
	<h1 class="text-4xl font-bold">{division.name}</h1>

	<div>
		<a href="grupper">Grupper</a>
		<a href="slutspel">Slutspel</a>
	</div>

	{@render children()}

	<button onclick={submitDelete}>Radera division</button>
</div>
