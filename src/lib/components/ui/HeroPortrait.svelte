<script lang="ts">
	import type { Hero } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		hero: Hero;
		size?: 'xs' | 'sm' | 'md';
		class?: ClassValue;
	};

	let { hero, size = 'md', class: classProp }: Props = $props();

	const sizeClass = $derived(
		{
			xs: 'size-7 rounded',
			sm: 'size-12 rounded-md',
			md: 'size-20 rounded-xl'
		}[size]
	);
</script>

<img src="/heroes/{hero.slug}.webp" alt={hero.name} class={[sizeClass, classProp]} />
