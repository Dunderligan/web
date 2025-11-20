<script lang="ts">
	import { enhance } from '$app/forms';
	import { uploadRosterLogo } from '$lib/remote/roster.remote';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		rosterId: string;
	};

	let { rosterId }: Props = $props();

	let files: FileList | null = $state(null);
	let form: HTMLFormElement;

	const srcOverride = $derived.by(() =>
		files && files.length > 0 ? URL.createObjectURL(files[0]) : null
	);

	function onchange() {
		form.submit();
	}
</script>

<form {...uploadRosterLogo} enctype="multipart/form-data" bind:this={form} use:enhance>
	<label class="group relative flex size-24 cursor-pointer items-center justify-center">
		<RosterLogo
			id={rosterId}
			class="absolute h-full w-full transition-all group-hover:brightness-75"
			imgSize={128}
			src={srcOverride}
		/>
		<div
			class="z-10 hidden items-center justify-center rounded-lg bg-gray-600 p-2 text-xl text-white group-hover:flex"
		>
			<Icon icon="ph:upload-simple" />
		</div>
		<input type="file" name="file" accept="image/png" class="hidden" {onchange} bind:files />
	</label>
	<input type="text" name="rosterId" value={rosterId} class="hidden" />
</form>
