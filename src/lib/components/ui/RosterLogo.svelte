<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import placeholderTeam from '$lib/assets/images/placeholder-team.avif';
	import cdn from '$lib/cdn';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		id: string;
		class?: ClassValue;
		size: 'sm' | 'md' | 'lg' | 'xl' | number;
		src?: string | null;
		href?: ResolvedPathname | null;
	};

	let { id, class: classProp, size: sizeProp = 'md', src: srcOverride, href }: Props = $props();

	const size = $derived(
		typeof sizeProp === 'number'
			? sizeProp
			: {
					sm: 32,
					md: 48,
					lg: 64,
					xl: 160
				}[sizeProp]
	);

	let src = $derived(srcOverride ?? cdn.rosterLogoUrl(id, { width: size }));

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
	<img
		{src}
		{onerror}
		style="width: {size}px; height: {size}px;"
		class={[classProp, 'shrink-0 rounded-[20%] object-contain']}
		alt="Logotyp"
	/>
{/snippet}
