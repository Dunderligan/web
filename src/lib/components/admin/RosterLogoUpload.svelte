<script lang="ts">
	import { uploadRosterLogo } from '$lib/remote/roster.remote';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import ImageUpload from './ImageUpload.svelte';

	type Props = {
		rosterId: string;
		onUpload?: () => void;
	};

	let { rosterId, onUpload }: Props = $props();

	async function upload(buffer: ArrayBuffer) {
		await uploadRosterLogo({ rosterId, file: buffer });
		onUpload?.();
	}
</script>

<ImageUpload alt="Roster logo" {upload}>
	{#snippet image({ src, class: imgClass })}
		<RosterLogo id={rosterId} class={imgClass} imgSize={128} {src} />
	{/snippet}
</ImageUpload>
