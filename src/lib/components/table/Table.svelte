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
	};

	let { columns, rows, row, key, class: classProp }: Props = $props();
</script>

<div
	class={[
		classProp,
		'__table grid w-full gap-y-1 overflow-hidden overflow-x-auto rounded-lg text-lg font-medium text-gray-700 dark:text-gray-300'
	]}
>
	{#each columns as { label, center = false, note }, i}
		<div
			class={[
				i === 0 && !center && 'pl-6',
				center && 'justify-center',
				'__table-header flex items-center gap-1 bg-gray-50 py-2 text-base text-gray-600 dark:bg-gray-800 dark:text-gray-400'
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

<style>
	:global(.__table > :not(.__table-header)) {
		background-color: var(--color-gray-100);
		display: flex;
		align-items: center;
	}

	:global(.dark .__table > :not(.__table-header)) {
		background-color: var(--color-gray-900);
	}
</style>
