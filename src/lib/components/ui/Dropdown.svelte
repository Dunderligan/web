<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Item = {
		label: string;
		icon?: string;
		href?: string;
		onclick?: () => void;
		hidden?: boolean;
	};

	type Props = {
		items: Item[];
		children?: Snippet;
		class?: ClassValue;
	};

	let { children, items, class: classProp }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={classProp}>
		{@render children?.()}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="floating">
		{#each items as { label, icon, href, onclick, hidden }}
			{#if !hidden}
				<DropdownMenu.Item class="floating-item">
					<svelte:element
						this={href ? 'a' : 'div'}
						{onclick}
						{href}
						class="flex h-full w-full items-center gap-2"
					>
						{#if icon}
							<Icon {icon} />
						{/if}

						{label}
					</svelte:element>
				</DropdownMenu.Item>
			{/if}
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
