<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from './Notice.svelte';
	import Button from './Button.svelte';

	type Props = {
		createDialogOpen: boolean;
		children?: Snippet;
		createButtonLabel?: string;
	};

	let {
		createDialogOpen = $bindable(false),
		children,
		createButtonLabel = 'Lägg till'
	}: Props = $props();
</script>

<Notice kind="info">
	{@render children?.()}

	<Button
		icon="mdi:add"
		label={createButtonLabel}
		kind="transparent"
		class="ml-auto"
		onclick={() => (createDialogOpen = true)}
	/>
</Notice>
