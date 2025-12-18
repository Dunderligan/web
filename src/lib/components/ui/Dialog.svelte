<script lang="ts">
	import { Dialog, type DialogRootProps } from 'bits-ui';
	import { backOut, quadOut, sineOut } from 'svelte/easing';
	import { fade, fly, scale } from 'svelte/transition';
	import type { ButtonKind } from '$lib/types';
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';

	type ButtonType = {
		label: string;
		icon?: string;
		kind?: ButtonKind;
		disabled?: boolean;
		loading?: boolean;
		onclick?: () => void;
	};

	type Props = {
		title: string;
		buttons?: ButtonType[];
		description?: string | Snippet;
		wide?: boolean;
		onsubmit?: () => void;
	} & DialogRootProps;

	let {
		title,
		buttons,
		description,
		open = $bindable(false),
		children,
		wide = false,
		onsubmit,
		...restProps
	}: Props = $props();
</script>

<Dialog.Root {...restProps} bind:open>
	<Dialog.Portal>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div
						{...props}
						class="fixed inset-0 z-40 bg-black/40"
						transition:fade={{ duration: 100 }}
					></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>
		<Dialog.Content forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div
						class={[
							'fixed top-[50%] left-[50%] z-40 w-full max-w-[calc(100%-1rem)] translate-x-[-50%] translate-y-[-50%] space-y-2 rounded-xl bg-white p-8 shadow-xl dark:border dark:border-gray-800 dark:bg-gray-900',
							wide ? 'sm:max-w-xl' : 'sm:max-w-lg'
						]}
						transition:fade={{ duration: 25 }}
						onkeydown={(evt) => {
							if (evt.key === 'Enter') {
								onsubmit?.();
							}
						}}
						{...props}
					>
						<Dialog.Title
							class={[
								description ? 'mb-2' : 'mb-4',
								'text-center font-display text-2xl font-bold text-gray-900 dark:text-gray-200'
							]}>{title}</Dialog.Title
						>

						{#if description}
							<Dialog.Description
								class="mb-6 text-center font-medium text-gray-600 dark:text-gray-300"
							>
								{#if typeof description === 'string'}
									{description}
								{:else}
									{@render description()}
								{/if}
							</Dialog.Description>
						{/if}

						{@render children?.()}

						{#if buttons}
							<div class="flex items-center justify-end gap-2 pt-4">
								{#each buttons as button}
									<Button {...button} />
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
