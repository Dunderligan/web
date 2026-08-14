<script lang="ts">
	import { socials } from '$lib/socials';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<a class="group ml-0.5 font-semibold" href={socials.discord}>
	<Icon icon="ph:arrow-square-out" />
	<span class="group-hover:underline">{@render children()}</span>
</a>
