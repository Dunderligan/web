<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { cdnImageSrc } from '$lib/util';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		topMargin?: boolean;
		children?: Snippet;
	};

	let { children, topMargin = true, class: classProp }: Props = $props();
</script>

<main
	class={[
		topMargin && 'mt-18',
		'relative z-0 grow overflow-hidden bg-white px-4 pt-12 pb-20 shadow-2xl'
	]}
>
	<div class={[classProp, 'mx-auto max-w-4xl']}>
		{@render children?.()}
	</div>

	<div
		class="halftone pointer-events-none absolute bottom-0 -z-10 h-[600px] w-full"
		style="mask-image: url('{cdnImageSrc('/halftone.png', { width: 512 })}');"
	></div>
</main>

<style>
	.halftone {
		mask-image: url('https://cdn.kesomannen.com/cdn-cgi/image/fit=scale_down,format=auto,height=512/dunderligan/halftone.png');
		mask-size: cover;
		mask-repeat: no-repeat;
		background-image: linear-gradient(
			to top right,
			var(--color-gray-100) 0%,
			var(--color-transparent) 50%
		);
	}

	/* main::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 100%;
		height: 50rem;
		background: var(--color-gray-200);
		mask-image: url('/dotted-bg.svg');
		mask-size: cover;
		pointer-events: none;
		z-index: -1;
	} */
</style>
