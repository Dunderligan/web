<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { cdnImageSrc } from '$lib/util';

	type Props = { id: string; class?: ClassValue };

	let { id, class: classProp }: Props = $props();

	let element: HTMLImageElement;

	function onerror() {
		element.src = '/placeholder-team.jpg';
		element.style.borderRadius = '100%';
	}
</script>

<img
	src={cdnImageSrc(`/logos/${id}.png`, { width: 96 })}
	class={[classProp, 'size-12 shrink-0 rounded-md']}
	{onerror}
	alt=""
	bind:this={element}
/>
