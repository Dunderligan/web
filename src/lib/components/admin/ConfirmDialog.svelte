<script lang="ts">
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import Dialog from '../ui/Dialog.svelte';

	let context = ConfirmContext.get();

	let loading = $state(false);
	let open = $derived(context.current !== null);

	async function confirm() {
		if (!context.current) return;

		if (context.current.action) {
			try {
				loading = true;
				await context.current.action();
			} finally {
				loading = false;
			}
		}

		context.submit(true);
	}
</script>

<Dialog
	bind:open
	title={context.current?.title ?? ''}
	onOpenChange={(newState) => {
		if (!newState) {
			context.submit(false);
		}
	}}
	buttons={[
		{
			label: 'Avbryt',
			kind: 'secondary',
			disabled: loading,
			onclick: () => context.submit(false)
		},
		{
			label: 'Fortsätt',
			kind: context.current?.negative ? 'negative' : 'primary',
			icon: context.current?.icon,
			loading,
			onclick: confirm
		}
	]}
>
	{#if context.current}
		<div class="text-lg font-medium text-gray-600">
			{@html context.current.description}
		</div>
	{/if}
</Dialog>
