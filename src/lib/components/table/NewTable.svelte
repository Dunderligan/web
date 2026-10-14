<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import type { PlaceholderProps } from '$lib/types';
	import Placeholder from '../ui/Placeholder.svelte';
	import Tooltip from '../ui/Tooltip.svelte';

	type Kind = 'neutral' | 'transparent';

	type ColumnContent =
		| { snippet: Snippet<[T, number]> }
		| { content: (value: T, index: number) => string | number };

	type Column = {
		label?: string;
		tooltip?: string | Snippet;
		center?: boolean;
		width?: string;
		class?: ClassValue;
	} & ColumnContent;

	type Props = {
		columns: Column[];
		key: (value: T) => number | string;
		rows: T[];
		class?: ClassValue;
		kind?: Kind;
		placeholder?: PlaceholderProps;
	};

	let { columns, rows, key, class: classProp, kind = 'neutral', placeholder }: Props = $props();

	const fixedLayout = $derived(columns.some((c) => c.width));
</script>

{#if rows.length === 0 && placeholder}
	<Placeholder {...placeholder} class={[classProp, placeholder.class, 'w-full']} />
{:else}
	<div class="overflow-x-auto">
		<table
			class={[
				classProp,
				fixedLayout ? 'table-fixed' : 'table-auto',
				'w-full border-separate border-spacing-x-0 border-spacing-y-1 overflow-hidden rounded-lg font-medium'
			]}
		>
			<colgroup>
				{#each columns as { label, width }, i (label ?? i)}
					<col style={width ? `width: ${width}` : undefined} />
				{/each}
			</colgroup>

			<thead>
				<tr
					class={[
						'rounded-t-lg',
						kind === 'transparent'
							? 'border-gray-200 dark:border-gray-700'
							: 'bg-gray-50 dark:bg-gray-900/50'
					]}
				>
					{#each columns as { label, center, tooltip: note }, i (label ?? i)}
						<th
							class={[
								'px-1.5 py-1 font-medium text-gray-600 first:pl-3 last:pr-3 dark:text-gray-400',
								center ? 'text-center' : 'text-left'
							]}
						>
							{#if label}
								{#if note}
									<Tooltip content={note} underline>
										{label}
									</Tooltip>
								{:else}
									{label}
								{/if}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, i (key(row))}
					<tr
						class={[
							i === rows.length - 1 && 'rounded-b-lg',
							kind === 'transparent'
								? 'border-b border-gray-100 dark:border-gray-800'
								: 'gap-y-1 bg-gray-100 dark:bg-gray-900'
						]}
					>
						{#each columns as column, j (String(key(row)) + '-' + (column.label ?? j))}
							<td class={[column.center && 'text-center', 'px-1.5 first:pl-3 last:pr-3']}>
								<div
									class={[
										column.class,
										column.center && 'justify-center',
										'flex min-h-14 items-center py-1.5'
									]}
								>
									{#if 'snippet' in column}
										{@render column.snippet(row, i)}
									{:else if column.content}
										{column.content(row, i)}
									{/if}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
