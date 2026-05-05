<script lang="ts">
	import { search } from '$lib/remote/misc.remote';
	import { flattenGroup } from '$lib/util';
	import AdminLink from '../admin/AdminLink.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import InputField from '../ui/InputField.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		open?: boolean;
	};

	let query = $state('');
	let remoteQuery = $derived(query.length >= 3 ? search({ query }) : null);

	let { open = $bindable(false) }: Props = $props();
</script>

<Dialog bind:open title="Sök hela webbplatsen">
	<InputField
		class="w-full"
		bind:value={query}
		placeholder="Sök efter spelare, lag eller säsonger..."
	/>

	<div class="h-60">
		{#if remoteQuery}
			{#await remoteQuery}
				<!-- <p>Söker...</p> -->
			{:then { results }}
				{#if results.length === 0}
					<p>Inga resultat</p>
				{:else}
					<div class="space-y-1 overflow-hidden rounded-lg">
						{#each results as result (result.id)}
							<AdminLink
								href={result.href}
								onclick={() => {
									open = false;
									query = '';
								}}
							>
								{#if result.type === 'roster'}
									<RosterLogo id={result.id} class="mr-2 inline size-12" />
								{/if}

								<div>
									{result.name}
								</div>

								{#if result.subtitle}
									<div class="text-base font-medium">
										{result.subtitle}
									</div>
								{/if}
							</AdminLink>
						{/each}
					</div>
				{/if}
			{/await}
		{:else}
			<!-- <p>Skriv minst 3 tecken för att söka</p> -->
		{/if}
	</div>
</Dialog>
