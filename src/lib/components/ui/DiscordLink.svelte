<script lang="ts">
	import { socials } from '$lib/socials';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import Link from './Link.svelte';

	let props: Omit<HTMLAnchorAttributes, 'href'> = $props();
</script>

<Link href={socials.discord} {...props} openInNewTab />
