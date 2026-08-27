<script lang="ts">
	import cdn from '$lib/cdn';
	import { uploadRosterLogo } from '$lib/remote/roster.remote';
	import ImageUpload from '../form/ImageUpload.svelte';

	type Props = {
		rosterName?: string;
		rosterId: string;
		onUpload?: () => void;
	};

	let { rosterName, rosterId, onUpload }: Props = $props();

	async function upload(file: File) {
		const buffer = await file.arrayBuffer();
		await uploadRosterLogo({ rosterId, file: buffer });
		onUpload?.();
	}
</script>

<ImageUpload
	alt={rosterName ?? 'Roster logo'}
	{upload}
	src={cdn.srcUrl(cdn.rosterLogoKey(rosterId))}
/>
