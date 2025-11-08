<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		kind: 'info' | 'warn';
		children?: Snippet;
	};

	let { kind, children }: Props = $props();

	const { icon, classes } = $derived(
		{
			info: {
				icon: 'mdi:info',
				classes: 'bg-accent-50 text-accent-800'
			},
			warn: {
				icon: 'mdi:warning',
				classes: 'bg-yellow-50 text-yellow-800'
			}
		}[kind]
	);
</script>

<div class={[classes, 'flex min-h-14 items-center gap-2 rounded-lg py-2 pr-3 pl-6 font-medium']}>
	<Icon {icon} />

	{@render children?.()}
</div>
