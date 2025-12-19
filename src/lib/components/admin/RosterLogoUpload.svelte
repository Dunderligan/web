<script lang="ts">
	import { enhance } from '$app/forms';
	import { uploadRosterLogo } from '$lib/remote/roster.remote';
	import Icon from '../ui/Icon.svelte';
	import Notice from '../ui/Notice.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		rosterId: string;
		onUpload?: () => void;
	};

	let { rosterId, onUpload }: Props = $props();

	let files: FileList | null = $state(null);
	let srcOverride: string | null = $state(null);

	let loading = $state(false);

	async function onchange() {
		if (!files || files.length === 0) return;

		loading = true;
		try {
			const file = files[0];
			const buffer = await file.arrayBuffer();

			await uploadRosterLogo({ rosterId, file: buffer });

			srcOverride = URL.createObjectURL(file);
			onUpload?.();
		} finally {
			loading = false;
		}
	}
</script>

<label class="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center">
	<RosterLogo
		id={rosterId}
		class={[loading ? 'brightness-50' : 'group-hover:brightness-75', 'absolute h-full w-full']}
		imgSize={128}
		src={srcOverride}
	/>
	<div
		class={[
			loading ? 'flex' : 'hidden group-hover:flex',
			'z-10 items-center justify-center rounded-lg bg-gray-600 p-2 text-xl text-white'
		]}
	>
		{#if loading}
			<Icon class="animate-spin" icon="ph:spinner" />
		{:else}
			<Icon icon="ph:upload-simple" />
		{/if}
	</div>
	<input
		type="file"
		name="file"
		accept="image/jpeg, image/png, image/webp, image/avif, image/gif, image/tiff"
		class="hidden"
		{onchange}
		bind:files
		disabled={loading}
	/>
</label>
