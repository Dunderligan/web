<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import { createSeason } from '$lib/remote/season.remote';
	import { seasonState } from '$lib/util.js';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';

	let { data } = $props();

	SaveContext.set(new SaveContext());

	let seasons = $state(data.seasons);

	let createSeasonOpen = $state(false);

	let newSeasonName = $state('');
	let newSeasonStartedAt = $state(new Date());

	let useSr = $state(false);

	async function submitNewSeason() {
		const { season } = await createSeason({
			name: newSeasonName,
			startedAt: newSeasonStartedAt,
			useSr
		});

		await goto(`/admin/sasong/${season.id}`);
	}

	function resetNewSeason() {
		newSeasonName = '';
		newSeasonStartedAt = new Date();
	}
</script>

<Breadcrumbs crumbs={[]} />

<AdminCard title="Säsonger">
	{#if seasons.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createSeasonOpen = true)}>
			Det finns inga säsonger!
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each seasons as { id, name, startedAt } (id)}
				<AdminLink href="/admin/sasong/{id}">
					<span>{name}</span>
					<span class="ml-2 text-base font-medium text-gray-700">{startedAt.getFullYear()}</span>
				</AdminLink>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createSeasonOpen = true)} />
	{/if}
</AdminCard>

<CreateDialog
	title="Skapa säsong"
	bind:open={createSeasonOpen}
	oncreate={submitNewSeason}
	onclose={resetNewSeason}
	disabled={!newSeasonName.trim()}
>
	<Label label="Namn">
		<InputField bind:value={newSeasonName} placeholder="T.ex. Säsong 1..." />
	</Label>

	<Label label="Startdatum">
		<DateInput bind:value={newSeasonStartedAt} type="date" required />
	</Label>

	<Label label="Använd SR-poäng">
		<Checkbox bind:checked={useSr} />
	</Label>
</CreateDialog>
