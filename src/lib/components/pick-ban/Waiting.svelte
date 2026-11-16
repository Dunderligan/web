<script lang="ts">
	import Icon from '../ui/Icon.svelte';

	type Props = {
		text: string;
	};

	let { text }: Props = $props();
</script>

<div class="flex grow flex-col items-center justify-center gap-2">
	<Icon icon="ph:hourglass" class="text-7xl text-gray-300 dark:text-gray-600" />

	<p class="text-lg text-gray-600 dark:text-gray-300">{text}</p>
</div>
