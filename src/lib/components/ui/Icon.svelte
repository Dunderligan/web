<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import 'iconify-icon';

	type Props = {
		icon: string;
		title?: string;
		class?: ClassValue;
	};

	let { icon, title, class: classProp }: Props = $props();
</script>

<iconify-icon {icon} class={classProp} inline {...title ? { title } : {}}></iconify-icon>
