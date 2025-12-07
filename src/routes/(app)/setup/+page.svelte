<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { createSuperUser } from '$lib/remote/auth.remote';

	let battletag = $state('');
	let loading = $state(false);

	async function submit() {
		loading = true;
		try {
			await createSuperUser({ battletag });
			await invalidateAll();
			await goto('/admin');
		} finally {
			loading = false;
		}
	}
</script>

<PageSection>
	<p class="mb-4">
		<span class="text-xl font-semibold text-gray-900"
			>Välkommen till din nya instans av Dunderligan!</span
		>
		<br />
		<span class="font-medium text-gray-800">
			För att komma igång, skapa en adminanvändare nedan. Du får välja vilken battletag/namn som
			helst, dock om du vill kunna logga in med Battle.net måste du använda din egen.</span
		>
	</p>

	<div class="max-w-lg space-y-1">
		<Label label="Battletag">
			<InputField bind:value={battletag} />
		</Label>

		<div class="flex justify-end">
			<Button
				onclick={submit}
				label="Skapa"
				icon="ph:plus"
				class="mt-2"
				{loading}
				disabled={!battletag}
			/>
		</div>
	</div>
</PageSection>
