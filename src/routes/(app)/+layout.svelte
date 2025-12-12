<script lang="ts">
	let { children } = $props();
</script>

<div id="background" class="fixed top-0 min-h-140 w-full min-w-lg"></div>

<div class="relative flex min-h-screen flex-col overflow-hidden">
	<div
		class="pointer-events-none fixed top-32 -left-200 size-400 rounded-full bg-accent-400/20 dark:bg-accent-600/10"
		id="splotch"
	></div>

	<div class="mb-12 h-18"></div>

	{@render children?.()}
</div>

<style>
	#background {
		background-size: cover;
		aspect-ratio: 16 / 9;
		background-image:
			linear-gradient(to bottom, transparent, var(--color-gray-100) 100%), url('/striped-bg.png');
	}

	:global(.dark) #background {
		filter: brightness(0.7);
		mix-blend-mode: multiply;
		background-image:
			linear-gradient(to bottom, transparent, var(--color-gray-800) 100%), url('/striped-bg.png');
	}

	#splotch {
		filter: blur(1000px);
	}
</style>
