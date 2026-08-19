<script lang="ts">
	import { uploadRosterLogo } from '$lib/remote/roster.remote';
	import ImageUpload from '../ui/ImageUpload.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		rosterId: string;
		onUpload?: () => void;
	};

	let { rosterId, onUpload }: Props = $props();

	async function upload(file: File) {
		const fileBuffer = await file.arrayBuffer();
		await uploadRosterLogo({ rosterId, file: fileBuffer });
		onUpload?.();
	}
</script>

<ImageUpload {upload}>
	{#snippet image({ srcOverride, class: classProp })}
		<RosterLogo id={rosterId} imgSize={128} class={classProp} src={srcOverride} />
	{/snippet}
</ImageUpload>
