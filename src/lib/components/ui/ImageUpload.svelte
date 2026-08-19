<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		image?: Snippet<[{ srcOverride: string | null; class: ClassValue }]>;
		file?: File;
		src?: string;
		upload?: (file: File) => Promise<void>;
		onFileChanged?: (file: File) => void;
	};

	let { image, file = $bindable(), src, upload, onFileChanged }: Props = $props();

	let files: FileList | null = $state(null);
	let loading = $state(false);

	const resolvedSrc = $derived(file ? URL.createObjectURL(file) : src);

	const imageClass: ClassValue = $derived([
		loading ? 'brightness-50' : 'group-hover:brightness-75',
		'absolute h-full w-full rounded-xl'
	]);

	async function onchange() {
		if (!files || files.length === 0) return;

		file = files[0];
		onFileChanged?.(file);

		if (upload) {
			loading = true;
			try {
				await upload(file);
			} finally {
				loading = false;
			}
		}
	}
</script>

<label class="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center">
	{#if image}
		{@render image({ srcOverride: resolvedSrc ?? null, class: imageClass })}
	{:else if file}
		<img src={resolvedSrc} class={[imageClass, 'object-contain']} alt="" />
	{:else}
		<div
			class={[
				imageClass,
				'flex items-center justify-center rounded-lg bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
			]}
		>
			<Icon icon="ph:image" class="text-2xl" />
		</div>
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
		accept="image/*"
		class="hidden"
		{onchange}
		bind:files
		disabled={loading}
	/>
</label>
