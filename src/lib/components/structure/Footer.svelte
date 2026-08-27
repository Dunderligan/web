<script lang="ts">
	import { page } from '$app/state';
	import Icon from '../ui/Icon.svelte';
	import TeamSocial from '../ui/TeamSocial.svelte';
	import logo from '$lib/assets/images/logo.webp';
	import lysatorLogo from '$lib/assets/images/lysator.svg';
	import { socials } from '$lib/socials';
	import Dialog from '../ui/Dialog.svelte';
	import Button from '../ui/Button.svelte';
	import Link from '../ui/Link.svelte';

	let emailDialogOpen = $state(false);

	const commitHash = $derived(page.data.commitHash);
</script>

<footer class="relative bg-gray-900 px-4 pt-10 pb-16 text-center font-medium text-gray-300">
	<div class="mx-auto flex max-w-4xl flex-col items-start gap-8 text-left md:flex-row">
		<div class="w-full">
			<img src={logo} alt="Dunderligan" class="-mt-2 size-14" />
			<p class="text-lg">Dunderligan</p>
			<div class="mt-4 grid w-max grid-cols-6 gap-x-3 gap-y-3 md:grid-cols-3">
				{#each Object.entries(socials) as [platform, href]}
					<TeamSocial {platform} {href} class="text-2xl" />
				{/each}
			</div>
			<p class="mt-4 text-gray-400">
				Byggd av Bobbo med ❤️
				<br />
				Dunderligan är <Link href={socials.github} openInNewTab>öppen källkod</Link>.
				<br />
				{#if commitHash}
					<Icon icon="ph:git-commit" class="inline-block" />
					<Link href="https://github.com/Dunderligan/web/commit/{commitHash}" openInNewTab
						>{commitHash.slice(0, 7)}</Link
					>
				{:else}
					Okänd version
				{/if}
			</p>
		</div>

		<div class="flex w-full flex-col items-start gap-1">
			<div class="mb-2 text-xl font-semibold text-white">Navigation</div>

			<Link href="/" class="text-lg hover:underline">Startsida</Link>
			<Link href="/stallningar" class="text-lg hover:underline">Ställningar</Link>
			<Link href="/arkiv" class="text-lg hover:underline">Arkiv</Link>
			<Link href="/om" class="text-lg hover:underline">Om oss</Link>
		</div>

		<div class="flex w-full flex-col items-start">
			<div class="mb-2 text-xl font-semibold text-white">Kontakt</div>

			<Button
				label="Visa e-postadress"
				icon="ph:envelope"
				kind="secondary"
				onclick={() => (emailDialogOpen = true)}
			/>
		</div>

		<div class="flex w-full items-center gap-4 text-gray-400">
			<a href="https://www.lysator.liu.se/inhysningar" class="flex shrink-0"
				><img src={lysatorLogo} alt="Lysator" class="size-16" /></a
			>

			<div>Hemsidan driftas i samarbete med Lysator.</div>
		</div>
	</div>
</footer>

<Dialog
	bind:open={emailDialogOpen}
	title="E-postadress"
	buttons={[
		{
			label: 'Stäng',
			onclick: () => (emailDialogOpen = false),
			kind: 'secondary',
			icon: 'ph:x-circle'
		}
	]}
>
	{#snippet description()}
		Du kan nå oss på <Link href="mailto:dunderleagueow@gmail.com">dunderleagueow@gmail.com</Link>
	{/snippet}
</Dialog>
