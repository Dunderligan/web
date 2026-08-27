<script lang="ts">
	import 'iconify-icon';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		icon: string;
		title?: string;
		class?: ClassValue;
	};

	let { icon, title, class: classProp }: Props = $props();
</script>

<iconify-icon {icon} class={classProp} inline {...title ? { title } : {}} noobserver></iconify-icon>
