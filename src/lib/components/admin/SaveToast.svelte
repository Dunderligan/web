<script lang="ts">
	import { quartOut } from 'svelte/easing';
	import Button from '../ui/Button.svelte';
	import { fly } from 'svelte/transition';
	import { SaveContext } from '$lib/state/save.svelte';
	import { Portal } from 'bits-ui';

	const context = SaveContext.get();

	type SaveState = 'default' | 'success' | 'error' | 'reset';

	let saveState: SaveState = $state('default');

	const isShown = $derived(saveState !== 'default' || context.isDirty);

	const text = $derived.by(() => {
		switch (saveState) {
			case 'default':
				return 'Försiktigt! Du har osparade ändringar!';
			case 'success':
				return 'Sparat!';
			case 'error':
				return 'Kunde inte spara dina ändringar!';
			case 'reset':
				return 'Återställde dina ändringar.';
		}
	});

	async function onsaveclick() {
		try {
			await context.save();
			saveState = 'success';
			hideAfter(1000);
		} catch {
			saveState = 'error';
			hideAfter(2000);
		}
	}

	async function ondiscardclick() {
		await context.discard();
		saveState = 'reset';
		hideAfter(750);
	}

	function hideAfter(millis: number) {
		setTimeout(() => (saveState = 'default'), millis);
	}

	function onkeydown(evt: KeyboardEvent) {
		if (evt.key === 's' && evt.ctrlKey && isShown) {
			onsaveclick();
			evt.preventDefault();
		}
	}
</script>

<svelte:window {onkeydown} />

<Portal>
	{#if isShown}
		<div
			transition:fly={{ y: 10, duration: 150, easing: quartOut }}
			class={[
				(saveState == 'default' || saveState === 'reset') &&
					'border-gray-100 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300',
				saveState == 'success' &&
					'border-green-100 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
				saveState == 'error' &&
					'border-red-100 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
				'fixed bottom-8 left-1/2 z-20 flex h-16 w-full max-w-3xl translate-x-[-50%] items-center gap-2 rounded-xl border pr-4 pl-8 text-lg font-semibold shadow-sm'
			]}
		>
			<span class="mr-auto"> {text} </span>

			{#if saveState === 'default'}
				<Button
					label="Återställ"
					kind="tertiary"
					onclick={ondiscardclick}
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
			{/if}
		</div>
	{/if}
</Portal>
