<script lang="ts">
	import { Dialog, type DialogRootProps } from 'bits-ui';

	type Props = {
		title: string;
	} & DialogRootProps;

	let { title, open = $bindable(false), children, ...restProps }: Props = $props();
</script>

<Dialog.Root {...restProps} bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/40"></Dialog.Overlay>
		<Dialog.Content
			class="fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] bg-white p-5 sm:max-w-lg md:w-full"
		>
			<Dialog.Title class="text-xl font-bold">{title}</Dialog.Title>

			{@render children?.()}</Dialog.Content
		>
	</Dialog.Portal>
</Dialog.Root>
