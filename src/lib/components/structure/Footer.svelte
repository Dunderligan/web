<script lang="ts">
	import { page } from '$app/state';
	import Icon from '../ui/Icon.svelte';
	import TeamSocial from '../ui/TeamSocial.svelte';

	const socials = [
		{
			platform: 'youtube',
			href: 'https://www.youtube.com/@dunderligan_ow'
		},
		{
			platform: 'twitter',
			href: 'https://x.com/dunderligan'
		},
		{
			platform: 'discord',
			href: 'https://discord.gg/74Y9B7dTNN'
		},
		{
			platform: 'twitch',
			href: 'https://www.twitch.tv/dunderligan_ow'
		},
		{
			platform: 'github',
			href: 'https://github.com/Dunderligan'
		},
		{
			platform: 'tiktok',
			href: 'https://www.tiktok.com/@dunderligan'
		}
	];

	const commitHash = $derived(page.data.commitHash);
</script>

<footer class="relative bg-gray-900 px-4 pt-10 pb-16 text-center font-medium text-gray-300">
	<div class="mx-auto flex max-w-4xl flex-col items-start gap-8 text-left md:flex-row">
		<div class="w-full">
			<img src="/logo.png" alt="Dunderligan" class="-mt-2 size-14" />
			<p class="text-lg">Dunderligan</p>
			<div class="mt-4 grid w-max grid-cols-6 gap-x-3 gap-y-3 md:grid-cols-3">
				{#each socials as social}
					<TeamSocial {...social} class="text-2xl" />
				{/each}
			</div>
			<p class="mt-4 text-gray-400">
				Byggd av Bobbo med ❤️
				<br />
				Dunderligan är <a class="underline" href="https://github.com/Dunderligan">öppen källkod</a>.
				<br />
				{#if commitHash}
					<Icon icon="ph:git-commit" class="inline-block" />
					<a href="https://github.com/Dunderligan/web/commit/{commitHash}" class="underline"
						>{commitHash.slice(0, 7)}</a
					>
				{:else}
					Okänd version
				{/if}
			</p>
		</div>

		<div class="flex w-full flex-col items-start gap-1">
			<div class="mb-2 text-xl font-semibold text-white">Navigation</div>

			<a href="/" class="text-lg hover:underline">Startsida</a>
			<a href="/stallningar" class="text-lg hover:underline">Ställningar</a>
			<a href="/arkiv" class="text-lg hover:underline">Arkiv</a>
			<a href="/om" class="text-lg hover:underline">Om oss</a>
		</div>

		<div class="flex w-full flex-col items-start">
			<div class="mb-2 text-xl font-semibold text-white">Kontakt</div>

			<a href="mailto:dunderleagueow@gmail.com" class="text-lg hover:underline">
				dunderleagueow@gmail.com
			</a>
		</div>

		<div class="flex w-full items-center gap-4 text-gray-400">
			<a href="https://www.lysator.liu.se/inhysningar" class="flex shrink-0"
				><img src="/lysator.svg" alt="Lysator" class="size-16" /></a
			>

			<div>Hemsidan driftas i samarbete med Lysator.</div>
		</div>
	</div>

	<!-- <div class="pointer-events-none absolute inset-0" id="pattern"></div> -->
</footer>

<style>
	/* #pattern {
		background-image: url('/topographic-bg.jpg');
		filter: invert(0);
		mix-blend-mode: multiply;
	} */
</style>
