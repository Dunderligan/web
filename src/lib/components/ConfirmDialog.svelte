<script lang="ts">
	import { ConfirmState } from '$lib/state/confirm.svelte';
	import Dialog from './Dialog.svelte';

	let state = ConfirmState.get();

	let open = $derived(state.current !== null);

	$inspect(state.current);
</script>

<Dialog
	bind:open
	title={state.current?.title ?? ''}
	onOpenChange={() => state.callback(false)}
	buttons={[
		{
			label: 'Avbryt',
			kind: 'secondary',
			onclick: () => state.callback(false)
		},
		{
			label: 'Fortsätt',
			kind: 'primary',
			onclick: () => state.callback(true)
		}
	]}
>
	{#if state.current}
		<p>
			{state.current.description}
		</p>
	{/if}
</Dialog>
