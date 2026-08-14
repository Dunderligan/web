<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import Note from '../ui/Note.svelte';

	type Column = {
		label: string;
		center?: boolean;
		note?: string | Snippet;
	};

	type Props = {
		columns: Column[];
		rows: T[];
		row: Snippet<[{ value: T; index: number }]>;
		key?: (value: T) => any;
		class?: ClassValue;
		noBackground?: boolean;
	};

	let { columns, rows, row, key, class: classProp, noBackground }: Props = $props();
</script>

<div
	class={[
		classProp,
		noBackground
			? '*:border-b *:border-gray-200 dark:*:border-gray-800'
			: 'gap-y-1 *:bg-gray-100 dark:*:bg-gray-900',
		'grid w-full overflow-hidden overflow-x-auto rounded-lg text-lg font-medium text-gray-700 *:flex *:items-center dark:text-gray-300'
	]}
>
	{#each columns as { label, center = false, note }, i}
		<div
			class={[
				i === 0 && !center && 'pl-6',
				center && 'justify-center',
				noBackground ? 'border-gray-300! dark:border-gray-700!' : 'bg-gray-50! dark:bg-gray-800!',
				'flex items-center gap-1 py-2 text-base'
			]}
		>
			{label}

			{#if note}
				<Note content={note} class="hidden sm:block" />
			{/if}
		</div>
	{/each}

	{#each rows as value, index (key?.(value) ?? value)}
		{@render row({ value, index })}
	{/each}
</div>
