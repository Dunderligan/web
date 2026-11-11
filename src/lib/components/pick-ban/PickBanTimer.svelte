<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut, sineIn } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	type Props = {
		max: number;
		value: number | null;
		class?: string;
	};

	let { max, value, class: classProp }: Props = $props();

	const percentFilled = $derived.by(() => {
		if (value === null) return 100;

		const eased = sineIn(value / max);
		return Math.max(0, Math.min(100, eased * 100));
	});

	const label = $derived.by(() => {
		if (value === null) return '---';

		let secs = value ?? 0;
		const mins = Math.floor(secs / 60);
		secs = Math.round(secs % 60);

		return `${mins}:${secs.toString().padStart(2, '0')}`;
	});

	const { bgColor, fgColor, labelColor } = $derived.by(() => {
		if (value === null) {
			return {
				bgColor: 'bg-gray-100',
				fgColor: 'bg-gray-300',
				labelColor: 'text-gray-400'
			};
		}

		if (percentFilled < 15) {
			return {
				bgColor: 'bg-red-100',
				fgColor: 'bg-red-600',
				labelColor: 'text-red-800'
			};
		}

		return {
			bgColor: 'bg-accent-100',
			fgColor: 'bg-accent-600',
			labelColor: 'text-accent-800'
		};
	});

	const easedPercentFilled = new Tween(0, {
		duration: 1000,
		easing: cubicOut
	});

	$effect(() => {
		easedPercentFilled.target = percentFilled;
	});

	onMount(() => {
		// set the initial value immediately without animation
		easedPercentFilled.set(percentFilled, { duration: 0 });
	});
</script>

<div class={['grid grid-cols-[1fr_2rem_1fr] items-center gap-4 transition-colors', classProp]}>
	<div class={[bgColor, 'h-2 rounded-l-full']}>
		<div
			class={[fgColor, 'ml-auto h-full rounded-l-full']}
			style={`width: ${easedPercentFilled.current}%`}
		></div>
	</div>

	<div class={['text-center text-xl font-semibold', labelColor]}>{label}</div>

	<div class={[bgColor, 'h-2 rounded-r-full']}>
		<div
			class={[fgColor, 'h-full rounded-r-full']}
			style={`width: ${easedPercentFilled.current}%`}
		></div>
	</div>
</div>
