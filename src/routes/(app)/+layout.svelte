<script lang="ts">
	let { children } = $props();
</script>

<div id="background" class="fixed top-0 min-h-[35rem] w-full min-w-lg"></div>

<div class="relative flex min-h-screen flex-col overflow-hidden">
	<div
		class="pointer-events-none fixed top-32 left-[-50rem] size-[100rem] rounded-full bg-accent-400/20"
		id="splotch"
	></div>

	<div class="mb-8 h-18"></div>

	{@render children?.()}
</div>

<style>
	#background {
		background-image:
			linear-gradient(to bottom, transparent, var(--color-gray-100) 100%), url('/striped-bg.png');
		background-size: cover;
		aspect-ratio: 16 / 9;
	}

	#splotch {
		filter: blur(1000px);
	}
</style>
