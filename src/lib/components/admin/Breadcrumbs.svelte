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

<div class="flex items-center gap-4 font-display text-lg">
	<a href="/admin" class="flex items-center justify-center">
		<Icon icon="ph:house" class="text-2xl text-gray-600" />
	</a>

	{#each crumbs as { label, href }, i}
		{@const isLast = i == crumbs.length - 1}

		<Icon class={[!isLast && 'hidden sm:block', 'text-2xl text-gray-600']} icon="ph:caret-right" />

		<a
			{href}
			class={[
				isLast
					? 'font-bold text-accent-600 hover:text-accent-700 hover:underline'
					: 'hidden font-medium text-gray-600 hover:text-gray-700 hover:underline sm:block'
			]}>{label}</a
		>
	{/each}
</div>
