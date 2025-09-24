<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { cdnImageSrc } from '$lib/util';

	type Props = { id: string; class?: ClassValue };

	let { id, class: classProp }: Props = $props();
</script>

<img
	src={cdnImageSrc(`/logos/${id}.png`, { width: 128 })}
	class={[classProp, 'size-12 shrink-0 rounded-md']}
	alt=""
/>
