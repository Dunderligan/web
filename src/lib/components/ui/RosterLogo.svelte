<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { cdnImageSrc, cdnRosterLogoPath } from '$lib/util';
	import placeholderTeam from '$lib/assets/images/placeholder-team.avif';

	type Props = {
		id: string;
		class?: ClassValue;
		imgSize?: number;
		src?: string | null;
		href?: string | null;
	};

	let { id, class: classProp, imgSize = 64, src: srcOverride, href }: Props = $props();

	let src = $derived(srcOverride ?? cdnImageSrc(cdnRosterLogoPath(id), { width: imgSize }));

	function onerror() {
		src = placeholderTeam;
	}
</script>

{#if href}
	<a {href} class="shrink-0">{@render image()}</a>
{:else}
	{@render image()}
{/if}

{#snippet image()}
	<img {src} {onerror} class={[classProp, 'shrink-0 rounded-[20%] object-contain']} alt="Logotyp" />
{/snippet}
