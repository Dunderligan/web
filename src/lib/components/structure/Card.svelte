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
		reverse ? 'md:flex-row-reverse' : 'md:flex-row',
		'flex flex-col items-center overflow-hidden rounded-xl bg-gray-100 text-lg font-medium dark:bg-gray-900'
	]}
>
	<img class="h-auto w-100 object-cover object-center" src={image} {alt} />

	<div class="px-14 py-12">
		<h3 class="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

		<div>
			{@render children?.()}
		</div>
	</div>
</div>
