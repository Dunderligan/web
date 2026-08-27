<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import Note from '../ui/Note.svelte';

	type Kind = 'neutral' | 'transparent';

	type Column = {
		label?: string;
		note?: string | Snippet;
		center?: boolean;
		width?: string;
	};

	type Props = {
		columns: Column[];
		rows: T[];
		row: Snippet<[{ value: T; index: number }]>;
		key?: (value: T) => any;
		class?: ClassValue;
		kind?: Kind;
	};

	let { columns, rows, row, key, class: classProp, kind = 'neutral' }: Props = $props();

	const gridTemplateColumns = $derived(columns.map((c) => c.width ?? 'auto').join(' '));
</script>

<div
	class={[
		classProp,
		kind === 'transparent'
			? '*:border-b *:border-gray-100 dark:*:border-gray-800'
			: 'gap-y-1 *:bg-gray-100 dark:*:bg-gray-900',
		'table-root grid w-full overflow-hidden overflow-x-auto rounded-lg font-medium text-gray-700 *:flex *:min-h-14 *:items-center *:px-4 *:py-1.5 dark:text-gray-300'
	]}
	style="grid-template-columns: {gridTemplateColumns};"
>
	{#each columns as { label, center, note }, i}
		<div
			class={[
				center && 'justify-center',
				kind === 'transparent'
					? 'border-gray-200! dark:border-gray-700!'
					: 'bg-gray-50! dark:bg-gray-800!',
				'table-header flex min-h-0! items-center gap-1 py-2 text-gray-600 dark:text-gray-400'
			]}
		>
			{#if label}
				{label}
			{/if}

			{#if note}
				<Note content={note} class="hidden sm:block" />
			{/if}
		</div>
	{/each}

	{#each rows as value, index (key?.(value) ?? value)}
		{@render row({ value, index })}
	{/each}
</div>
