<script lang="ts">
	import Placeholder from '../ui/Placeholder.svelte';

	const defaultOption = {
		icon: 'ph:magnifying-glass',
		text: 'Inga matcher hittades'
	};

	const easterEggs = [
		{
			icon: 'ph:detective',
			text: 'Nils Numbani spanar fortfarande...'
		},
		{
			icon: 'ph:skull',
			text: 'In my world, there are no secrets'
		},
		{
			icon: 'ph:eyeglasses',
			text: 'The world can always use more heroes. Are you with me?'
		},
		{
			icon: 'ph:lightning',
			text: 'Tagga Dunderligan!'
		},
		{
			icon: 'ph:phone',
			text: 'De stora ligorna kan inte nås...'
		}
	];

	let option = $state(defaultOption);

	pickOption(false);

	function pickOption(alwaysEasterEgg: boolean) {
		if (!alwaysEasterEgg && Math.random() < 0.95) {
			return defaultOption;
		}

		const index = easterEggs.findIndex((other) => other.text == option.text);
		if (index == -1) {
			return easterEggs[Math.floor(Math.random() * easterEggs.length)];
		} else {
			return easterEggs[(index + 1) % easterEggs.length];
		}
	}
</script>

<Placeholder {...option} onclick={() => (option = pickOption(true))} />
