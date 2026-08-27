<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes & {
		openInNewTab?: boolean;
		colored?: boolean;
	};

	let {
		children,
		class: classProp,
		openInNewTab: openInNewTabProp,
		colored,
		href,
		...rest
	}: Props = $props();

	const isExternal = $derived(href && href.startsWith('http') && !href.startsWith(page.url.origin));
	const openInNewTab = $derived(openInNewTabProp === undefined ? isExternal : openInNewTabProp);
</script>

<a
	class={[classProp, colored && 'text-accent-700 dark:text-accent-500', 'group ml-0.5']}
	rel={isExternal ? 'noopener noreferrer' : undefined}
	target={openInNewTab ? '_blank' : undefined}
	{href}
	{...rest}
>
	{#if isExternal || openInNewTab}
		<Icon icon={openInNewTab ? 'ph:arrow-square-out' : 'ph:link-simple'} class="text-base" />
	{/if}

	<span class="group-hover:underline">{@render children?.()}</span>
</a>
