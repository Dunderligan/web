<script lang="ts">
	import { quartOut } from 'svelte/easing';
	import Button from '../ui/Button.svelte';
	import { fly } from 'svelte/transition';
	import { SaveContext } from '$lib/state/save.svelte';
	import { Portal } from 'bits-ui';
	import { goto } from '$app/navigation';

	const context = SaveContext.get();

	async function onsaveclick() {
		await context.save();
		if (context.href) {
			await goto(context.href);
		}
	}
</script>

<Portal>
	{#if context.isDirty}
		<div
			class="fixed bottom-8 left-1/2 z-20 flex w-full max-w-3xl translate-x-[-50%] items-center gap-2 rounded-xl border border-gray-100 bg-white py-3 pr-4 pl-8 text-lg font-semibold text-gray-600 shadow-sm"
			transition:fly={{ y: 10, duration: 150, easing: quartOut }}
		>
			<span class="mr-auto"> Försiktigt! Du har osparade ändringar! </span>

			<Button
				label="Återställ"
				kind="tertiary"
				onclick={context.discard}
				loading={context.discarding}
				disabled={context.saving}
			/>

			<Button
				icon="ph:floppy-disk"
				label="Spara"
				kind="primary"
				onclick={onsaveclick}
				loading={context.saving}
				disabled={context.discarding}
			/>
		</div>
	{/if}
</Portal>
