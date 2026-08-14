<script lang="ts">
	import { page } from '$app/state';
	import { isModerator } from '$lib/authRole';
	import { SaveContext } from '$lib/state/save.svelte';
	import Icon from '../ui/Icon.svelte';

	type Crumb = {
		label: string;
		href: string;
	};

	type Props = {
		crumbs?: Crumb[];
	};

	let { crumbs = [] }: Props = $props();

	const saveCtx = SaveContext.get();

	const userIsModerator = $derived(isModerator(page.data.user?.role));
</script>

<div class="flex h-8 items-center gap-4 font-display text-lg text-gray-600 dark:text-gray-400">
	{#if userIsModerator}
		<a
			href="/admin"
			class="flex items-center justify-center text-xl hover:text-gray-700 dark:hover:text-gray-300"
		>
			<Icon icon="ph:house" />
		</a>
	{/if}

	{#each crumbs as { label, href }, i}
		{@const isLast = i == crumbs.length - 1}

		<!-- for non-moderators, only show the current page -->
		{#if userIsModerator || isLast}
			<Icon class={[!isLast && 'hidden sm:block', 'text-xl']} icon="ph:caret-right" />

			<a
				{href}
				class={[
					isLast
						? 'font-bold text-accent-600 hover:text-accent-700 hover:underline dark:hover:text-accent-500'
						: 'hidden font-medium hover:text-gray-700 hover:underline sm:block dark:hover:text-gray-300'
				]}>{label}</a
			>
		{/if}
	{/each}

	{#if saveCtx.href}
		<a
			class="ml-2 text-sm font-medium hover:text-accent-700 hover:underline dark:hover:text-accent-500"
			href={saveCtx.href}
		>
			<Icon icon="ph:link-simple" />
			Visa</a
		>
	{/if}
</div>
