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
			icon: 'ph:island',
			text: 'Är det dags för Maltaresan?'
		},
		{
			icon: 'ph:skull',
			text: 'In my world, there are no secrets'
		},
		{
			icon: 'ph:mailbox',
			text: 'Skägget i brevlådan!'
		},
		{
			icon: 'ph:flag',
			text: 'Alla till mig!'
		},
		{
			icon: 'ph:eyeglasses',
			text: 'The world can always use more heroes. Are you with me?'
		},
		{
			icon: 'ph:code',
			text: 'When in doubt, skyll på Bobbo'
		},
		{
			icon: 'ph:lightning',
			text: 'Tagga Dunderligan!'
		},
		{
			icon: 'ph:phone',
			text: 'De stora ligorna ringer... svarar du?'
		},
		{
			icon: 'ph:planet',
			text: 'What is that melody?'
		},
		{
			icon: 'ph:prohibit',
			text: '[MINEFIELD DEPLOYED]'
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

<button
	class="w-full max-w-2xs space-y-2 rounded-lg bg-gray-100 p-10 text-center text-gray-700 dark:bg-gray-900 dark:text-gray-300"
	onclick={() => (option = pickOption(true))}
>
	<Icon icon={option.icon} class="mx-auto block text-4xl" />
	<span class="text-xl font-semibold">{option.text}</span>
</button>
