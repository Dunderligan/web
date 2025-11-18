<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from '../ui/Dialog.svelte';

	type Props = {
		title: string;
		open?: boolean;
		disabled?: boolean;
		createLabel?: string;
		oncreate?: () => Promise<void>;
		onclose?: () => void;
		children: Snippet;
	};

	let {
		title,
		open = $bindable(false),
		disabled,
		createLabel = 'Skapa',
		oncreate,
		onclose,
		children
	}: Props = $props();

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
	onsubmit={() => {
		if (!loading && !disabled) create();
	}}
	buttons={[
		{
			label: 'Avbryt',
			kind: 'secondary',
			disabled: loading,
			onclick: close
		},
		{
			label: createLabel,
			icon: 'ph:plus',
			disabled,
			loading,
			onclick: create
		}
	]}
>
	{@render children()}
</Dialog>
