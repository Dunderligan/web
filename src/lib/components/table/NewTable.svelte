<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import type { ComponentProps, Snippet } from 'svelte';
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
		placeholder?: ComponentProps<typeof Placeholder>;
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
				'border-spacing-x- w-full min-w-xl border-separate border-spacing-y-0.75 overflow-hidden rounded-lg font-medium'
			]}
		>
			<colgroup>
				{#each columns as { label, width }, i (label ?? i)}
					<col style={width ? `width: ${width}` : undefined} />
				{/each}
			</colgroup>

			<thead>
				<tr class={['rounded-t-lg', kind === 'neutral' && 'bg-gray-50 dark:bg-gray-900/50']}>
					{#each columns as { label, center, tooltip: note }, i (label ?? i)}
						<th
							class={[
								center ? 'text-center' : 'text-left',
								kind === 'transparent' && 'border-b border-gray-200 dark:border-gray-700',
								'px-1.5 py-1 font-medium text-gray-600 first:pl-3 last:pr-3 dark:text-gray-400'
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
							kind === 'neutral' && 'gap-y-1 bg-gray-100 dark:bg-gray-900'
						]}
					>
						{#each columns as column, j (String(key(row)) + '-' + (column.label ?? j))}
							<td
								class={[
									column.center && 'text-center',
									kind === 'transparent' && 'border-b border-gray-100 dark:border-gray-800',
									'px-1.5 first:pl-3 last:pr-3'
								]}
							>
								<div
									class={[
										column.class,
										column.center && 'justify-center',
										'flex min-h-14 items-center py-1'
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
