<script lang="ts">
	import type { AwardType } from '$lib/types';
	import fallbackIcon from '$lib/assets/images/placeholder.avif';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		type: AwardType;
		class?: ClassValue;
	};

	let { type, class: classProp }: Props = $props();
</script>

<img
	src={type.imageUrl ?? fallbackIcon}
	alt={type.name}
	class={['rounded-full object-contain shadow-sm dark:brightness-90', classProp]}
/>
