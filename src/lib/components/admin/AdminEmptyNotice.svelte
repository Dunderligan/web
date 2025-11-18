<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from '../ui/Notice.svelte';
	import Button from '../ui/Button.svelte';

	type Props = {
		children?: Snippet;
		oncreateclick?: () => void;
		createButtonLabel?: string;
		createButtonIcon?: string;
	};

	let {
		children,
		oncreateclick,
		createButtonLabel = 'Lägg till',
		createButtonIcon = 'ph:plus'
	}: Props = $props();
</script>

<Notice kind="info">
	{@render children?.()}

	<Button
		icon={createButtonIcon}
		label={createButtonLabel}
		kind="transparent"
		class="ml-auto shrink-0"
		onclick={oncreateclick}
	/>
</Notice>
