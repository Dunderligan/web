<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes & {
		openInNewTab?: boolean;
		colored?: boolean;
		hideExternalIcon?: boolean;
	};

	let {
		children,
		class: classProp,
		openInNewTab: openInNewTabProp,
		colored,
		href,
		hideExternalIcon,
		...rest
	}: Props = $props();

	const isExternal = $derived(href && href.startsWith('http') && !href.startsWith(page.url.origin));
	const openInNewTab = $derived(openInNewTabProp === undefined ? isExternal : openInNewTabProp);
</script>

<!-- This component handles both internal and external links, while resolve only handles internal links -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	class={[classProp, colored && 'text-accent-700 dark:text-accent-500', 'group']}
	rel={isExternal ? 'noopener noreferrer external' : undefined}
	target={openInNewTab ? '_blank' : undefined}
	{...rest}
>
	{#if (isExternal || openInNewTab) && !hideExternalIcon}
		<Icon icon={openInNewTab ? 'ph:arrow-square-out' : 'ph:link-simple'} class="ml-0.5 text-base" />
	{/if}

	<span class="group-hover:underline">{@render children?.()}</span>
</a>
