<script lang="ts">
	import type { ClassValue } from '$lib/types';

	type Props = {
		name: string;
		size?: 'xs' | 'sm' | 'md';
		class?: ClassValue;
	};

	let { name, size = 'md', class: classProp }: Props = $props();

	const sizeClass = $derived(
		{
			xs: 'size-7 rounded',
			sm: 'size-12 rounded-md',
			md: 'size-20 rounded-xl'
		}[size]
	);
</script>

<img src="/heroes/{name}.webp" alt={name} class={[sizeClass, classProp]} />
