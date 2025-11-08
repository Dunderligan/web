<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Column =
		| string
		| {
				label: string;
				center?: boolean;
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

<div class={[classProp, 'grid w-full gap-y-1 overflow-hidden rounded-lg text-gray-700']}>
	{#each columns as column}
		{@const [label, center] =
			typeof column === 'string' ? [column, true] : [column.label, column.center ?? true]}

		<div
			class={[
				center ? 'text-center ' : 'text-left',
				'mb-0.5 bg-gray-50 py-2 font-medium text-gray-600'
			]}
		>
			{label}
		</div>
	{/each}

	{#each rows as value, index (key?.(value) ?? value)}
		{@render row({ value, index })}
	{/each}
</div>
