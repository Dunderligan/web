<script lang="ts">
	import { getDivisionsBySeason } from '$lib/remote/season.remote';
	import Select from '../ui/Select.svelte';

	type Props = {
		seasonId: string;
		groupId?: string;
	};

	let { seasonId, groupId = $bindable() }: Props = $props();
</script>

{#await getDivisionsBySeason({ seasonId }) then { divisions }}
	<Select
		type="single"
		class="grow"
		items={divisions.flatMap((division) =>
			division.groups.map((group) => ({
				label: `${division.name}, ${group.name}`,
				value: group.id
			}))
		)}
		bind:value={groupId}
		placeholder="Välj grupp"
	/>
{/await}
