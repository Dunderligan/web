<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import Icon from '../ui/Icon.svelte';

	type Crumb = {
		label: string;
		href: string;
	};

	type Props = {
		crumbs: Crumb[];
	};

	let { crumbs }: Props = $props();

	const saveCtx = SaveContext.get();
</script>

<div class="flex items-center gap-4 font-display text-lg text-gray-600">
	<a href="/admin" class="flex items-center justify-center">
		<Icon icon="ph:house" class="text-xl" />
	</a>

	{#each crumbs as { label, href }, i}
		{@const isLast = i == crumbs.length - 1}

		<Icon class={[!isLast && 'hidden sm:block', 'text-xl']} icon="ph:caret-right" />

		<a
			{href}
			class={[
				isLast
					? 'font-bold text-accent-600 hover:text-accent-700 hover:underline'
					: 'hidden font-medium hover:text-gray-700 hover:underline sm:block'
			]}>{label}</a
		>
	{/each}

	{#if saveCtx.href}
		<a class="ml-2 text-sm font-medium hover:text-accent-600 hover:underline" href={saveCtx.href}>
			<Icon icon="ph:link-simple" />
			Visa</a
		>
	{/if}
</div>
