<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	type Props = {
		title: string;
		open?: boolean;
		disabled?: boolean;
		oncreate?: () => Promise<void>;
		onclose?: () => void;
		children: Snippet;
	};

	let { title, open = $bindable(false), disabled, oncreate, onclose, children }: Props = $props();

	let loading = $state(false);

	async function create() {
		try {
			loading = true;
			await oncreate?.();
		} finally {
			loading = false;
		}
	}

	async function close() {
		onclose?.();
		open = false;
	}
</script>

<Dialog
	{title}
	bind:open
	buttons={[
		{
			label: 'Avbryt',
			kind: 'secondary',
			disabled: loading,
			onclick: close
		},
		{
			label: 'Skapa',
			icon: 'mdi:create',
			disabled,
			loading,
			onclick: create
		}
	]}
>
	{@render children()}
</Dialog>
