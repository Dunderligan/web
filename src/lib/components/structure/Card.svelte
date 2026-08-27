<script lang="ts">
	import type { CardProps } from '$lib/types';

	let { title, image, alt, reverse = false, children, class: classProp }: CardProps = $props();
</script>

<div
	class={[
		classProp,
		'grid grid-cols-1 items-stretch overflow-hidden rounded-xl bg-gray-100 text-lg font-medium sm:grid-cols-[1fr_1fr] dark:bg-gray-900'
	]}
>
	<img class={[reverse && 'sm:order-1', 'object-cover']} src={image} {alt} />

	<div class="p-10 md:p-12">
		<h3 class="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

		<div>
			{@render children?.()}
		</div>
	</div>
</div>
