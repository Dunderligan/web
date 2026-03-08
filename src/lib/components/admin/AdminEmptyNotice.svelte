<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from '../ui/Notice.svelte';
	import Button from '../ui/Button.svelte';

	type Props = {
		children?: Snippet;
		oncreateclick?: () => void;
		createButtonLabel?: string;
		createButtonIcon?: string;
		hideCreateButton?: boolean;
	};

	let {
		children,
		oncreateclick,
		createButtonLabel = 'Lägg till',
		createButtonIcon = 'ph:plus',
		hideCreateButton = false
	}: Props = $props();
</script>

<Notice kind="info">
	{@render children?.()}

	{#if !hideCreateButton}
		<Button
			icon={createButtonIcon}
			label={createButtonLabel}
			kind="transparent"
			class="ml-auto shrink-0"
			onclick={oncreateclick}
		/>
	{/if}
</Notice>
