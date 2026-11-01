<script lang="ts">
	import { socials } from '$lib/socials';
	import Link from './Link.svelte';
	import type { ComponentProps } from 'svelte';

	let props: Omit<ComponentProps<typeof Link>, 'href' | 'externalHref'> = $props();
</script>

<Link externalHref={socials.discord} {...props} openInNewTab class="font-semibold" />
