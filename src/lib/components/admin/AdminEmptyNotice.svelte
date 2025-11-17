<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from '../ui/Notice.svelte';
	import Button from '../ui/Button.svelte';

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
		icon="ph:plus"
		label={createButtonLabel}
		kind="transparent"
		class="ml-auto shrink-0"
		onclick={oncreateclick}
	/>
</Notice>
