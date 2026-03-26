<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		placement: number;
	};

	let { placement }: Props = $props();

	const { label, class: colorClass } = $derived(
		[
			{
				label: '1:a plats',
				class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
			},
			{
				label: '2:a plats',
				class: 'bg-gray-200 text-gray-700 dark:bg-gray-400 dark:text-gray-950'
			},
			{
				label: '3:e plats',
				class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 brightness-75'
			}
		][placement - 1] ?? {
			label: `${placement}:e plats`,
			class: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
		}
	);
</script>

<div
	class={[
		colorClass,
		'flex max-w-max items-center justify-center gap-2 rounded-full px-4 py-1 text-lg font-semibold'
	]}
>
	<Icon icon="ph:trophy" />

	{label}
</div>
