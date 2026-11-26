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
		onreorder?: (from: number, to: number) => void;
	};

	let {
		columns,
		rows,
		key,
		class: classProp,
		kind = 'neutral',
		placeholder,
		onreorder
	}: Props = $props();

	const fixedLayout = $derived(columns.some((c) => c.width));

	let draggedIndex = $state<number | null>(null);
	let dropIndex = $state<number | null>(null);

	function handleDragStart(event: DragEvent, index: number) {
		if (!onreorder) return;

		draggedIndex = index;

		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		if (!onreorder || draggedIndex === null) return;

		event.preventDefault();
		dropIndex = index;

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, index: number) {
		if (!onreorder || draggedIndex === null) return;

		event.preventDefault();

		if (draggedIndex !== index) {
			onreorder(draggedIndex, index);
		}

		resetDrag();
	}

	function resetDrag() {
		draggedIndex = null;
		dropIndex = null;
	}
</script>

{#if rows.length === 0 && placeholder}
	<Placeholder {...placeholder} class={[classProp, placeholder.class, 'w-full']} />
{:else}
	<div class="overflow-x-auto">
		<table
			class={[
				classProp,
				fixedLayout ? 'table-fixed' : 'table-auto',
				'border-spacing-x- w-full min-w-lg border-separate border-spacing-y-0.75 overflow-hidden rounded-lg font-medium'
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
						draggable={onreorder ? true : undefined}
						ondragstart={(event) => handleDragStart(event, i)}
						ondragover={(event) => handleDragOver(event, i)}
						ondrop={(event) => handleDrop(event, i)}
						ondragend={resetDrag}
						class={[
							i === rows.length - 1 && 'rounded-b-lg',
							kind === 'neutral' && 'gap-y-1 bg-gray-100 dark:bg-gray-900',
							onreorder && 'cursor-grab active:cursor-grabbing',
							draggedIndex === i && 'opacity-50',
							dropIndex === i &&
								draggedIndex !== i &&
								'animate-pulse bg-accent-50 outline -outline-offset-2 outline-accent-400 dark:bg-accent-900/50 dark:outline-accent-700'
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
