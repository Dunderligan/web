<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { cdnImageSrc } from '$lib/util';

	type Props = {
		id: string;
		class?: ClassValue;
		imgSize?: number;
		src?: string | null;
	};

	let { id, class: classProp, imgSize = 64, src: srcOverride }: Props = $props();

	let element: HTMLImageElement;

	function onerror() {
		element.src = '/placeholder-team.jpg';
		element.style.borderRadius = '100%';
	}
</script>

<img
	src={srcOverride ?? cdnImageSrc(`/logos/${id}.png`, { width: imgSize })}
	class={[classProp, 'shrink-0 rounded-md']}
	{onerror}
	alt=""
	bind:this={element}
/>
