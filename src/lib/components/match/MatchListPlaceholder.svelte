<script lang="ts">
	import Icon from '../ui/Icon.svelte';

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

<div
	class="w-full space-y-2 rounded-lg bg-gray-100 p-10 text-center text-gray-700 dark:bg-gray-900 dark:text-gray-300"
>
	<Icon icon={option.icon} class="mx-auto block text-4xl" />
	<span class="text-xl font-semibold">{option.text}</span>
</div>
