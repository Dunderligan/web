<div class="container">
	<div class="overlay1"></div>
	<div class="overlay2"></div>
</div>

<style>
	.container {
		position: relative;
		width: 50rem;
		height: 50rem;
		overflow: hidden;
	}

	.container > * {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.overlay1 {
		background: radial-gradient(circle at top right, var(--color-gray-400), transparent 50%);
		mask: url('/dots.svg') center/contain no-repeat;
		mask-size: 125% auto;
	}

	.overlay2 {
		backdrop-filter: blur(1px);
	}
</style>
