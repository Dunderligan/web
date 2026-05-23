<script lang="ts">
	import { goto } from '$app/navigation';
	import { isModerator } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Note from '$lib/components/ui/Note.svelte';
	import { createAwardType } from '$lib/remote/award.remote';
	import { SaveContext } from '$lib/state/save.svelte';

	let { data } = $props();

	SaveContext.set(new SaveContext());

	let awardTypes = $state(data.awardTypes);

	const canEdit = $derived(isModerator(data.user?.role));

	let createOpen = $state(false);
	let newName = $state('');
	let newShowDivision = $state(true);

	async function oncreate() {
		const { awardType } = await createAwardType({
			name: newName.trim(),
			showDivision: newShowDivision
		});

		await goto(`/admin/utmarkelser/${awardType.id}`);
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Utmärkelser', href: '/admin/utmarkelser' }]} />

<AdminCard title="Utmärkelser">
	{#if awardTypes.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createOpen = true)} hideCreateButton={!canEdit}>
			Inga utmärkelser har skapats än.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each awardTypes as awardType (awardType.id)}
				<AdminLink href="/admin/utmarkelser/{awardType.id}">
					<span>{awardType.name}</span>
					<span class="ml-2 text-base font-medium text-gray-500 dark:text-gray-400">
						{awardType.awards.length}st
					</span>
				</AdminLink>
			{/each}
		</div>

		{#if canEdit}
			<Button icon="ph:plus" onclick={() => (createOpen = true)} />
		{/if}
	{/if}
</AdminCard>

<CreateDialog
	title="Skapa utmärkelse"
	bind:open={createOpen}
	{oncreate}
	onclose={() => {
		newName = '';
		newShowDivision = true;
	}}
	disabled={!newName.trim()}
>
	<Label label="Namn">
		<InputField bind:value={newName} placeholder="T.ex. Role Star - Tank" />
	</Label>

	<Label label="Har division">
		<Note content="Är utmärkelsen relaterad till en specifik division (som t.ex. Role Star)?" />
		<Checkbox bind:checked={newShowDivision} />
	</Label>
</CreateDialog>
