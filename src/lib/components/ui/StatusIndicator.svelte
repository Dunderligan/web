<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		kind: 'inactive' | 'active' | 'outlined';
		title?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: ClassValue;
	};

	let { kind, size = 'md', title, class: classProp }: Props = $props();

	const kindClasses = $derived(
		{
			inactive: 'border-gray-200 bg-gray-400 dark:border-gray-700 dark:bg-gray-800',
			active: 'border-green-200 bg-green-400 dark:border-green-900 dark:bg-green-500',
			outlined: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950'
		}[kind]
	);

	const sizeClass = $derived(
		{
			sm: 'size-4 border-4',
			md: 'size-6 border-5',
			lg: 'size-10 border-10'
		}[size]
	);
</script>

<div class={[classProp, sizeClass, kindClasses, 'shrink-0 rounded-full']} {title}></div>
