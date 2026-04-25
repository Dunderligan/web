<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = {
		onenter?: () => void;
	} & Omit<HTMLTextareaAttributes, 'onkeydown'>;

	let { class: classProp, value = $bindable(), onenter, maxlength, ...props }: Props = $props();

	const length = $derived(value?.toString().length ?? 0);
</script>

<div class={[classProp, 'relative min-w-0 grow']}>
	<textarea
		class="field min-h-24 w-full"
		onkeydown={(evt) => {
			if (onenter && evt.key === 'Enter') {
				onenter();
			}
		}}
		bind:value
		{maxlength}
		{...props}
	></textarea>

	<div class="absolute right-3 bottom-1 text-sm text-gray-500 dark:text-gray-400">
		<span>{length}</span>{#if maxlength}<span>/{maxlength}</span>{/if}
	</div>
</div>
