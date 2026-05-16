<script lang="ts">
	import type { SearchItem } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import AdminLink from './AdminLink.svelte';

	type Props = {
		item: SearchItem;
		onclick?: () => void;
	};

	let { item, onclick }: Props = $props();

	const icon = $derived(
		{
			roster: 'ph:users',
			player: 'ph:user',
			season: null
		}[item.type]
	);
</script>

<AdminLink href={item.href} {onclick}>
	{#if item.type === 'roster'}
		<RosterLogo id={item.id} class="mr-3 size-12" imgSize={48} />
	{:else if item.image}
		<img
			src={item.image}
			alt={item.name}
			class="mr-3 size-12 shrink-0 rounded-[20%] object-contain"
		/>
	{/if}

	<div>
		<div>
			{#if icon}
				<Icon {icon} />
			{/if}

			{item.name}
		</div>

		{#if item.subtitle}
			<div class="text-base font-medium">
				{item.subtitle}
			</div>
		{/if}
	</div>
</AdminLink>
