<script lang="ts">
	import type { GameProfile } from '$lib/types';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		name: string;
		profile: GameProfile | null;
		large?: boolean;
		hideLink?: boolean;
	};

	let { name, profile, large = false, hideLink = false }: Props = $props();
</script>

<div class={['flex items-center', large ? 'gap-6' : 'gap-2']}>
	{#if profile?.avatarUrl}
		<img
			src={profile.avatarUrl}
			alt="Profilbild"
			class={['rounded-[20%]', large ? 'size-30' : 'size-14']}
		/>
	{/if}

	<div class="text-left">
		<div class={[large ? 'text-6xl font-extrabold sm:text-6xl' : 'text-lg font-semibold']}>
			{name}
		</div>
		<div class={[large && 'mt-1 text-lg font-semibold text-gray-600 dark:text-gray-400']}>
			{profile?.title}
		</div>
	</div>

	{#if profile && !hideLink}
		<!-- the admin panel uses this component within a clickable card, which we don't want to trigger when clicking the link -->
		<Button
			onclick={(evt) => evt.stopPropagation()}
			kind="tertiary"
			icon="ph:arrow-square-out"
			title="Visa på blizzard.com"
			target="_blank"
			rel="noopener noreferrer"
			class="ml-auto"
			href="https://overwatch.blizzard.com/en-us/career/{profile.slug}"
		/>
	{/if}
</div>
