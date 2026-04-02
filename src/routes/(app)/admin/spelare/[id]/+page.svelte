<script lang="ts">
	import { isModerator } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminSocials from '$lib/components/admin/AdminSocials.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import HeroPortrait from '$lib/components/ui/HeroPortrait.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { editPlayer } from '$lib/remote/player.remote.js';
	import { SaveContext } from '$lib/state/save.svelte';
	import { capitalize } from '$lib/util.js';

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

	const remainingHeroes = $derived(
		data.heroes.filter((hero) => !player.signatureHeroes.some((sh) => sh.hero.id === hero.id))
	);

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
	emptyText="Denna spelare har inga länkade sociala medier."
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
				<div class="flex max-w-xl items-center gap-2">
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

		{#if player.aliases.length < 5}
			<Button icon="ph:plus" onclick={() => (createAliasOpen = true)} />
		{/if}
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
					<HeroPortrait name={hero.name} size="sm" />

					<div class="font-medium capitalize">
						{hero.name}
					</div>

					<Button
						icon="ph:trash"
						class="ml-2"
						kind="tertiary"
						title="Ta bort"
						onclick={() => {
							player.signatureHeroes.splice(i, 1);
							saveCtx.setDirty();
						}}
					/>
				</div>
			{/each}
		</div>

		{#if player.signatureHeroes.length < 3}
			<Button icon="ph:plus" onclick={() => (addSignatureHeroOpen = true)} />
		{/if}
	{/if}
</AdminCard>

<AdminCard title="Detaljer">
	<div class="space-y-2">
		<Label label="Pronomen">
			<InputField
				placeholder="T.ex. han/honom"
				onchange={saveCtx.setDirty}
				bind:value={player.pronouns}
				maxlength={20}
			/>
		</Label>

		<Label label="Beskrivning">
			<InputField
				onchange={saveCtx.setDirty}
				type="textarea"
				bind:value={player.description}
				maxlength={500}
				disabled={!isModerator(data.user?.role)}
			/>
		</Label>
	</div>
</AdminCard>

<CreateDialog
	bind:open={createAliasOpen}
	title="Lägg till alias"
	description="Ange ett nytt alias för {player.battletag}. Det kan vara en tidigare battletag eller ett smeknamn."
	oncreate={async () => createNewAlias()}
	disabled={!newAlias.trim() || player.aliases.some((a) => a.name === newAlias.trim())}
>
	<Label label="Alias">
		<InputField bind:value={newAlias} />
	</Label>
</CreateDialog>

<CreateDialog
	bind:open={addSignatureHeroOpen}
	title="Lägg till signaturhjältar"
	oncreate={async () => addSignatureHero()}
	createLabel="Lägg till"
	disabled={!newSignatureHeroId}
>
	<Label label="Signaturhjälte">
		<Select
			type="single"
			bind:value={newSignatureHeroId}
			items={remainingHeroes.map((hero) => ({ label: capitalize(hero.name), value: hero.id }))}
			class="w-full"
			placeholder="Välj en hjälte"
		>
			{#snippet itemSnippet({ value })}
				{@const hero = data.heroes.find((h) => h.id === value)!}

				<HeroPortrait name={hero.name} size="xs" class="mr-2" />
			{/snippet}
		</Select>
	</Label>
</CreateDialog>

<SaveToast />
