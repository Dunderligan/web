<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		active: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: ClassValue;
	};

	let { active, size = 'md', class: classProp }: Props = $props();

	const sizeClass = $derived(
		{
			sm: 'size-4',
			md: 'size-8',
			lg: 'size-12'
		}[size]
	);
</script>

<div
	class={[
		classProp,
		sizeClass,
		active ? 'border-green-200 bg-green-400' : 'border-gray-200 bg-gray-400',
		'shrink-0 rounded-full border-4'
	]}
	title={active ? 'Ansluten' : 'Frånkopplad'}
></div>
