<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		reverse?: boolean;
		title: string;
		image: string;
		alt: string;
		children?: Snippet;
	};

	let { title, image, alt, reverse = false, children }: Props = $props();
</script>

<div
	class={[
		reverse ? 'lg:flex-row-reverse' : 'lg:flex-row',
		'flex flex-col overflow-hidden rounded-xl bg-gray-100 text-lg font-medium dark:bg-gray-900'
	]}
>
	<img src={image} {alt} class="lg:w-110" />

	<div class="px-10 py-8">
		<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

		<div>
			{@render children?.()}
		</div>
	</div>
</div>
