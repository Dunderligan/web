<script lang="ts">
	import { Tooltip } from 'bits-ui';

	let { children } = $props();
</script>

<div id="background" class="fixed top-0 min-h-140 w-full min-w-lg"></div>

<Tooltip.Provider delayDuration={300}>
	<div class="relative flex min-h-screen flex-col overflow-hidden">
		<div
			class="pointer-events-none fixed top-32 -left-140 size-400 rounded-full bg-accent-400/20 dark:mix-blend-hard-light"
			id="splotch"
		></div>

		<div class="mb-12 h-18"></div>

		{@render children?.()}
	</div>
</Tooltip.Provider>

<style>
	#background {
		background-size: cover;
		aspect-ratio: 16 / 9;
		background-image:
			linear-gradient(to bottom, transparent, var(--color-gray-100) 100%),
			url('$lib/assets/images/striped-bg.avif');
	}

	:global(.dark) #background {
		background-blend-mode: multiply, overlay, normal;
		background-image:
			linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)),
			url('$lib/assets/images/striped-bg.avif'), linear-gradient(var(--color-gray-900));
	}

	#splotch {
		filter: blur(1000px);
	}
</style>
