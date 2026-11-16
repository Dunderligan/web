<script lang="ts">
	import type { GamemodeCatalogEntry } from '$lib/pick-ban';
	import type { ClassValue } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import { gamemodeIcon } from '$lib/util';

	type Props = {
		gamemode: GamemodeCatalogEntry;
		class?: ClassValue;
	};

	let { gamemode, class: classProp }: Props = $props();
</script>

<span
	class={[
		classProp,
		'flex items-center justify-center rounded-full bg-white p-1 text-gray-700 shadow dark:bg-gray-100'
	]}
>
	<Icon icon={gamemodeIcon(gamemode.slug)} class="text-sm" title={gamemode.name} />
</span>
