<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { capitalize } from '$lib/util';
	import Icon from './Icon.svelte';

	type Props = {
		platform: string;
		href: string;
		class?: ClassValue;
	};

	let { platform, href, class: classProp }: Props = $props();
</script>

<a {href} class={classProp} target="_blank" rel="noopener noreferrer"
	><Icon
		class=" text-accent-500 transition-colors hover:text-accent-600"
		icon="ph:{platform}-logo-fill"
		title={capitalize(platform)}
	/></a
>
