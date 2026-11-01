<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notice from '../ui/Notice.svelte';

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

<Notice
	kind="info"
	button={hideCreateButton
		? undefined
		: {
				icon: createButtonIcon,
				label: createButtonLabel,
				kind: 'transparent',
				onclick: oncreateclick
			}}
>
	{@render children?.()}
</Notice>
