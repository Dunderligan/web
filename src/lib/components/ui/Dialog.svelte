<script lang="ts">
	import { Dialog, type DialogRootProps } from 'bits-ui';
	import { fade } from 'svelte/transition';
	import type { ButtonProps } from '$lib/types';
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';

	type Position = 'center' | 'top';

	type Props = {
		title: string;
		buttons?: ButtonProps[];
		description?: string | Snippet;
		wide?: boolean;
		position?: Position;
		onsubmit?: () => void;
	} & DialogRootProps;

	let {
		title,
		buttons,
		description,
		open = $bindable(false),
		children,
		wide = false,
		position = 'center',
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
							wide ? 'sm:max-w-xl' : 'sm:max-w-lg',
							position === 'top'
								? 'top-16 sm:top-[max(var(--spacing)*8,64px)]'
								: 'top-[50%] translate-y-[-50%]',
							'fixed left-[50%] z-40 w-full max-w-[calc(100%-1rem)] translate-x-[-50%] space-y-2 overflow-y-auto rounded-xl bg-white p-8 text-gray-600 shadow-xl dark:border dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
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
							<Dialog.Description class="mb-4 text-center font-medium">
								{#if typeof description === 'string'}
									{description}
								{:else}
									{@render description()}
								{/if}
							</Dialog.Description>
						{/if}

						{@render children?.()}

						{#if buttons}
							<div class="flex items-center justify-end gap-2 pt-2">
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
