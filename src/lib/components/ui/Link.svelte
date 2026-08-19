<script lang="ts">
	import Icon from './Icon.svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes & {
		openInNewTab?: boolean;
	};

	let { children, class: classProp, openInNewTab, ...rest }: Props = $props();
</script>

<a
	class={['group ml-0.5 font-semibold', classProp]}
	rel={openInNewTab ? 'noopener noreferrer' : undefined}
	target={openInNewTab ? '_blank' : undefined}
	{...rest}
>
	<Icon icon={openInNewTab ? 'ph:arrow-square-out' : 'ph:link'} />
	<span class="group-hover:underline">{@render children?.()}</span>
</a>
