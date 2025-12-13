<script lang="ts">
	import { seasonState } from '$lib/util';
	import Icon from './Icon.svelte';

	type Props = { state: 'upcoming' | 'ongoing' | 'ended' };

	let { state }: Props = $props();

	const {
		class: stateClass,
		icon,
		label
	} = $derived(
		{
			upcoming: {
				class:
					'bg-yellow-200 font-semibold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
				icon: 'ph:calendar-blank',
				label: 'Kommande'
			},
			ongoing: {
				class: 'bg-green-200 font-semibold text-green-800 dark:bg-green-800 dark:text-green-200',
				icon: 'ph:circle',
				label: 'Pågående'
			},
			ended: {
				class: 'bg-gray-200 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-200',
				icon: 'ph:check',
				label: 'Avslutad'
			}
		}[state]
	);
</script>

<div
	class={[stateClass, 'flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm']}
>
	<Icon class="text-lg" {icon} />
	<span>{label}</span>
</div>
