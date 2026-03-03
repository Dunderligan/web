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
	class="grid grid-cols-1 items-center overflow-hidden rounded-xl bg-gray-100 text-lg font-medium sm:grid-cols-[1fr_1fr] dark:bg-gray-900"
>
	<img class={[reverse && 'sm:order-1', 'h-full object-cover']} src={image} {alt} />

	<div class="p-10 md:p-12">
		<h3 class="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

		<div>
			{@render children?.()}
		</div>
	</div>
</div>
