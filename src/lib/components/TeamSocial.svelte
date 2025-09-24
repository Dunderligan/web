<script lang="ts">
	import type { SocialPlatform } from '$lib/types';
	import { capitalize } from '$lib/util';
	import Icon from './Icon.svelte';

	type Props = {
		platform: SocialPlatform;
		href: string;
	};

	let { platform, href }: Props = $props();
</script>

<a {href}
	><Icon
		class="text-4xl text-accent-600 transition-colors hover:text-accent-700"
		icon="mdi:{platform}"
		title={capitalize(platform)}
	/></a
>
