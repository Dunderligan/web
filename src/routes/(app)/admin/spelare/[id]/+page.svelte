<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminSocials from '$lib/components/admin/AdminSocials.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { editPlayer } from '$lib/remote/player.remote.js';
	import { SaveContext } from '$lib/state/save.svelte';

	let { data } = $props();

	let player = $state(data.player);
	const slug = $derived(player.battletag.replace('#', '-'));
	const href = $derived(`/spelare/${slug}`);

	SaveContext.set(new SaveContext({ save, href }));

	const saveCtx = SaveContext.get();

	let createAliasOpen = $state(false);
	let newAlias = $state('');

	let addSignatureHeroOpen = $state(false);
	let newSignatureHeroId: string | undefined = $state();

	async function save() {
		const signatureHeroes = player.signatureHeroes.map(({ hero }) => hero.id);
		const aliases = player.aliases.map(({ name }) => name);

		await editPlayer({
			id: player.id,
			pronouns: player.pronouns,
			description: player.description,
			socials: player.socials,
			signatureHeroes,
			aliases
		});
	}

	function createNewAlias() {
		const trimmed = newAlias.trim();
		if (!trimmed) return;

		player.aliases.push({ name: trimmed });

		newAlias = '';
		saveCtx.setDirty();
		createAliasOpen = false;
	}

	function addSignatureHero() {
		if (!newSignatureHeroId) return;

		const hero = data.heroes.find((h) => h.id === newSignatureHeroId);
		if (!hero) return;

		player.signatureHeroes.push({ hero });

		newSignatureHeroId = undefined;
		saveCtx.setDirty();
		addSignatureHeroOpen = false;
	}
</script>

<Breadcrumbs crumbs={[{ label: player.battletag, href }]} />

<AdminSocials
	emptyText="Detta spelare har inga länkade sociala medier."
	bind:socials={player.socials}
/>

<AdminCard title="Alias">
	{#if player.aliases.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createAliasOpen = true)}>
			Denna spelare har inga alias.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1.5 py-1">
			{#each player.aliases as alias, i}
				<div class="flex items-center gap-2">
					<InputField value={alias.name} />

					<Button
						icon="ph:trash"
						class="ml-2"
						kind="tertiary"
						title="Radera"
						onclick={() => {
							player.aliases.splice(i, 1);
							saveCtx.setDirty();
						}}
					/>
				</div>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createAliasOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Signaturhjältar">
	{#if player.signatureHeroes.length === 0}
		<AdminEmptyNotice oncreateclick={() => (addSignatureHeroOpen = true)}>
			Denna spelare har inga signaturhjältar.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1.5 py-1">
			{#each player.signatureHeroes as { hero }, i}
				<div class="flex items-center gap-2">
					<div>
						{hero.name}
					</div>

					<Button
						icon="ph:trash"
						class="ml-2"
						kind="tertiary"
						title="Radera"
						onclick={() => {
							player.signatureHeroes.splice(i, 1);
							saveCtx.setDirty();
						}}
					/>
				</div>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (addSignatureHeroOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Detaljer">
	<div class="space-y-2">
		<Label label="Pronomen">
			<InputField
				value={player.pronouns}
				placeholder="T.ex. han/honom"
				onchange={saveCtx.setDirty}
			/>
		</Label>

		<Label label="Beskrivning">
			<InputField
				value={player.description}
				placeholder=""
				onchange={saveCtx.setDirty}
				type="textarea"
			/>
		</Label>
	</div>
</AdminCard>

<CreateDialog
	bind:open={createAliasOpen}
	title="Lägg till alias"
	description="Ange ett nytt alias för {player.battletag}. Det kan vara ett tidigare battletag eller ett smeknamn."
	oncreate={async () => createNewAlias()}
>
	<Label label="Alias">
		<InputField bind:value={newAlias} />
	</Label>
</CreateDialog>

<CreateDialog
	bind:open={addSignatureHeroOpen}
	title="Lägg till signaturhjältar"
	description="Ange en ny signaturhjälte för {player.battletag}."
	oncreate={async () => addSignatureHero()}
	createLabel="Lägg till"
>
	<Label label="Signaturhjälte">
		<Select
			type="single"
			bind:value={newSignatureHeroId}
			items={data.heroes.map((hero) => ({ label: hero.name, value: hero.id }))}
			class="w-full"
			placeholder="Välj en hjälte"
		/>
	</Label>
</CreateDialog>

<SaveToast />
