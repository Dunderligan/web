<script lang="ts">
	import type { ChipColor, SubmissionStatus } from '$lib/types';
	import { formatSubmissionStatus } from '$lib/util';
	import Chip from '../ui/Chip.svelte';

	type Props = {
		status: SubmissionStatus;
		hideLabel?: boolean;
	};

	let { status, hideLabel }: Props = $props();

	const { icon, color } = $derived(
		{
			approved: { icon: 'ph:check-circle', color: 'green' },
			rejected: { icon: 'ph:x-circle', color: 'red' },
			pending: { icon: 'ph:hourglass', color: 'yellow' }
		}[status] as { icon: string; label: string; color: ChipColor }
	);
</script>

<Chip {icon} {color} label={formatSubmissionStatus(status)} {hideLabel} />
