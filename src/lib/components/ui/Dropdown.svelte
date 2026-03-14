<script lang="ts">
	import type { ClassValue, DropdownItem } from '$lib/types';
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		items: DropdownItem[];
		children?: Snippet;
		class?: ClassValue;
	};

	let { children, items, class: classProp }: Props = $props();

	const itemClass = 'flex h-full w-full items-center gap-2';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={classProp}>
		{@render children?.()}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="floating">
		{#each items as item}
			{#if !item.hidden}
				{#if item.type === 'button'}
					<DropdownMenu.Item class="floating-item">
						<svelte:element
							this={item.href ? 'a' : 'div'}
							role="menuitem"
							tabindex={-1}
							onclick={item.onclick}
							href={item.href}
							class={itemClass}
						>
							{#if item.icon}
								<Icon icon={item.icon} />
							{/if}

							{item.label}
						</svelte:element>
					</DropdownMenu.Item>
				{:else if item.type === 'checkbox'}
					<DropdownMenu.CheckboxItem
						class={['floating-item', itemClass]}
						checked={item.checked}
						onCheckedChange={item.onchange}
					>
						{#if item.icon}
							<Icon icon={item.icon} />
						{/if}

						{item.label}

						{#if item.checked}
							<Icon icon="ph:check" class="ml-auto" />
						{/if}
					</DropdownMenu.CheckboxItem>
				{/if}
			{/if}
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
