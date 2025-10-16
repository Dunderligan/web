<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from './Notice.svelte';
	import Button from './Button.svelte';

	type Props = {
		children?: Snippet;
		oncreateclick?: () => void;
		createButtonLabel?: string;
	};

	let { children, oncreateclick, createButtonLabel = 'Lägg till' }: Props = $props();
</script>

<Notice kind="info">
	{@render children?.()}

	<Button
		icon="mdi:add"
		label={createButtonLabel}
		kind="transparent"
		class="ml-auto"
		onclick={oncreateclick}
	/>
</Notice>
