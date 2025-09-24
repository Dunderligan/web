<script lang="ts">
	import TeamSocial from './TeamSocial.svelte';

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
			href: 'https://github.com/Kesomannen/dunderligan-web'
		}
	];
</script>

<footer class="relative bg-gray-900 px-4 pt-10 pb-16 text-center font-medium text-gray-200">
	<div class="mx-auto flex max-w-4xl items-start text-left">
		<div class="w-full">
			<img src="/logo.png" alt="Dunderligan" class="-mt-2 size-14" />
			<p class="text-lg">
				Dunderligan
				<br />
				Källkod under
				<a href="https://choosealicense.com/licenses/gpl-3.0/" class="underline">GPL v3</a>.
			</p>
			<div class="my-2 flex items-center gap-3">
				{#each socials as social}
					<TeamSocial {...social} class="text-2xl" />
				{/each}
			</div>
			<p class="text-gray-400">Byggd av Bobbo med ❤️</p>
		</div>

		<div class="hidden w-full flex-col items-start md:flex">
			<h4 class="mb-2 text-xl font-semibold text-white">Navigation</h4>

			<a href="/" class="block text-lg underline hover:text-accent-500">Startsida</a>
			<a href="/sasong/test" class="block text-lg underline hover:text-accent-500">Ställningar</a>
			<a href="/arkiv" class="block text-lg underline hover:text-accent-500">Arkiv</a>
			<a href="/om" class="block text-lg underline hover:text-accent-500">Om oss</a>
		</div>

		<div class="hidden w-full flex-col items-start md:flex">
			<h4 class="mb-2 text-xl font-semibold text-white">Kontakt</h4>

			<a href="mailto:info@dunderligan.se" class="block text-lg underline hover:text-accent-500"
				>info@dunderligan.se</a
			>
		</div>

		<div
			class="flex w-full flex-col items-center gap-4 text-center text-gray-400 sm:flex-row sm:text-left"
		>
			<img src="/lysator.svg" class="size-16" alt="Lysator" />

			<div>Hemsidan driftas i samarbete med Lysator.</div>
		</div>
	</div>

	<!-- <div class="pointer-events-none absolute inset-0" id="pattern"></div> -->
</footer>

<style>
	#pattern {
		background-image: url('/topographic-bg.jpg');
		filter: invert(0);
		mix-blend-mode: multiply;
	}
</style>
