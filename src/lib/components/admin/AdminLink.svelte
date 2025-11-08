<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		href: string;
		children?: Snippet;
	};

	let { href, children }: Props = $props();
</script>

<a
	{href}
	class="flex min-h-14 items-center justify-between bg-gray-100 px-6 py-2.5 text-gray-700 hover:bg-gray-200 hover:underline"
>
	<span class="text-lg font-semibold">{@render children?.()}</span>

	<Icon icon="mdi:arrow-right" class="text-xl" />
</a>
