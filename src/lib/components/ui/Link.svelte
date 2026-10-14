<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Icon from './Icon.svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Href = { href: ResolvedPathname; externalHref?: never } | { externalHref: string };

	type Props = HTMLAnchorAttributes & {
		openInNewTab?: boolean;
		colored?: boolean;
		hideExternalIcon?: boolean;
	} & Href;

	let {
		children,
		class: classProp,
		openInNewTab: openInNewTabProp,
		colored,
		href,
		externalHref,
		hideExternalIcon,
		...rest
	}: Props = $props();

	const isExternal = $derived(externalHref !== undefined);
	const openInNewTab = $derived(openInNewTabProp === undefined ? isExternal : openInNewTabProp);
</script>

<!-- This component handles both internal and external links, while resolve only handles internal links -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	href={href ?? externalHref}
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
