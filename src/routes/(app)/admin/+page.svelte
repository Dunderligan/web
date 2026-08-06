<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import { createSeason } from '$lib/remote/season.remote';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { isAdmin, isModerator } from '$lib/authRole.js';
	import AdminLinkList from '$lib/components/admin/AdminLinkList.svelte';

	let { data } = $props();

	SaveContext.set(new SaveContext());

	let seasons = $state(data.seasons);

	let createSeasonOpen = $state(false);

	let newSeasonName = $state('');
	let newSeasonStartedAt = $state(new Date());

	let legacyRanks = $state(false);
	let hidden = $state(false);

	async function submitNewSeason() {
		const { season } = await createSeason({
			name: newSeasonName,
			startedAt: newSeasonStartedAt,
			legacyRanks,
			hidden
		});

		await goto(`/admin/sasong/${season.id}`);
	}

	function resetNewSeason() {
		newSeasonName = '';
		newSeasonStartedAt = new Date();
	}
</script>

<Breadcrumbs />

<AdminCard title="Säsonger">
	<AdminLinkList
		items={seasons}
		linkHref={(season) => `/admin/sasong/${season.id}`}
		emptyText="Det finns inga säsonger!"
		oncreateclick={() => (createSeasonOpen = true)}
	>
		{#snippet linkContent({ item: season })}
			<span>{season.name}</span>
			<span class="ml-2 text-base font-medium">{season.startedAt.getFullYear()}</span>
		{/snippet}
	</AdminLinkList>
</AdminCard>

{#if isAdmin(data.user?.role)}
	<AdminCard>
		<div class="space-y-1 overflow-hidden rounded-lg">
			<AdminLink href="/admin/anvandare">Hantera användare</AdminLink>
			<AdminLink href="/admin/api-nycklar">Hantera API-nycklar</AdminLink>
		</div>
	</AdminCard>
{/if}

{#if isModerator(data.user?.role)}
	<AdminCard>
		<div class="space-y-1 overflow-hidden rounded-lg">
			<AdminLink href="/admin/utmarkelser">Hantera utmärkelser</AdminLink>
		</div>
	</AdminCard>
{/if}

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
		<Checkbox bind:checked={legacyRanks} />
	</Label>

	<Label label="Gömd">
		<Checkbox bind:checked={hidden} />
	</Label>
</CreateDialog>
