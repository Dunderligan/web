<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { quadOut, quartOut } from 'svelte/easing';
	import Button from './Button.svelte';
	import { fly } from 'svelte/transition';

	type Props = {
		open: boolean;
		onsave: () => Promise<void>;
	};

	let { open = $bindable(false), onsave }: Props = $props();

	let discarding = $state(false);
	let saving = $state(false);

	async function discard() {
		try {
			discarding = true;
			await invalidateAll();
			open = false;
		} finally {
			discarding = false;
		}
	}

	async function save() {
		try {
			saving = true;
			await onsave();
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed bottom-8 left-1/2 z-20 flex w-full max-w-3xl translate-x-[-50%] items-center gap-2 rounded-xl border border-gray-100 bg-white py-3 pr-4 pl-8 text-lg font-semibold text-gray-600 shadow-sm"
		transition:fly={{ y: 10, duration: 150, easing: quartOut }}
	>
		<span class="mr-auto"> Försiktigt! Du har osparade ändringar! </span>

		<Button label="Återställ" kind="tertiary" onclick={discard} loading={discarding} />
		<Button icon="mdi:content-save" label="Spara" kind="primary" onclick={save} loading={saving} />
	</div>
{/if}
