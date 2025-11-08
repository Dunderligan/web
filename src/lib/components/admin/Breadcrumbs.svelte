<script lang="ts">
	import Icon from '../ui/Icon.svelte';

	type Crumb = {
		label: string;
		href: string;
	};

	type Props = {
		crumbs: Crumb[];
	};

	let { crumbs }: Props = $props();
</script>

<div class="flex items-center gap-4 font-display text-xl">
	<a href="/admin" class="flex items-center justify-center">
		<Icon icon="mdi:home-outline" class="text-2xl text-gray-600" />
	</a>

	{#each crumbs as { label, href }, i}
		{@const isLast = i == crumbs.length - 1}

		<Icon class="text-2xl text-gray-600" icon="mdi:keyboard-arrow-right" />

		<a
			{href}
			class={[
				isLast
					? 'font-bold text-accent-600 hover:text-accent-700 hover:underline'
					: 'font-medium text-gray-600 hover:text-gray-700 hover:underline'
			]}>{label}</a
		>
	{/each}
</div>
