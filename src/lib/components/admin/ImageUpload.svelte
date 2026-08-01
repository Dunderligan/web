<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		alt: string;
		image: (string | null) | Snippet<[{ src: string | null; class: ClassValue }]>;
		upload: (buffer: ArrayBuffer) => Promise<void>;
	};

	let { alt, image, upload }: Props = $props();

	let files: FileList | null = $state(null);
	let srcOverride: string | null = $state(null);

	let loading = $state(false);

	const imageClass: ClassValue = $derived([
		loading ? 'brightness-50' : 'group-hover:brightness-75',
		'absolute h-full w-full'
	]);

	async function onchange() {
		if (!files || files.length === 0) return;

		loading = true;
		try {
			const file = files[0];
			const buffer = await file.arrayBuffer();

			await upload(buffer);

			srcOverride = URL.createObjectURL(file);
		} finally {
			loading = false;
		}
	}
</script>

<label class="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center">
	{#if !image}
		<div class={imageClass}>No image</div>
	{:else if typeof image === 'string'}
		<img {alt} src={srcOverride ?? image} class={imageClass} />
	{:else}
		{@render image({
			src: srcOverride,
			class: imageClass
		})}
	{/if}

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
