<script lang="ts">
	import { canEditUserPage, isModerator } from '$lib/authRole.js';
	import Field from '$lib/components/structure/Field.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import HeroPortrait from '$lib/components/ui/HeroPortrait.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import TeamSocial from '$lib/components/ui/TeamSocial.svelte';
	import { flattenGroup, roleIcon } from '$lib/util';

	let { data } = $props();

	const sortedMemberships = $derived(
		data.player.memberships.toSorted((a, b) => {
			const aSeason = flattenGroup(a.roster.group).season;
			const bSeason = flattenGroup(b.roster.group).season;

			return bSeason.startedAt.getTime() - aSeason.startedAt.getTime();
		})
	);

	const lastMembership = $derived(sortedMemberships.at(0));
	const name = $derived(data.player.battletag.split('#')[0]);
</script>

<PageHeader>
	<div class="flex items-center">
		<img
			src="https://imgsvc.trackercdn.com/url/size(128),fit(cover)/https%3A%2F%2Fd15f34w2p8l1cc.cloudfront.net%2Foverwatch%2Ffbc76412efb4257883ec5322e74a01d4893b7a03676501e08ce6469e7baf5357.png/image.jpg"
			alt="Profilbild"
			class="size-32 rounded-2xl"
		/>

		<h1 class="ml-6 text-6xl font-extrabold sm:text-left sm:text-6xl">{name}</h1>
	</div>
</PageHeader>

<PageSection class="flex flex-col-reverse gap-10 md:flex-row">
	<section class="shrink grow">
		{#if data.player.description}
			<p class="mb-2 text-lg font-medium text-gray-600 dark:text-gray-400">
				{data.player.description}
			</p>
		{/if}

		{#if lastMembership}
			{@const roster = lastMembership.roster}
			{@const { season } = flattenGroup(roster.group)}

			<p class="mb-8 text-lg font-semibold">
				Spelade senast i
				<a href="/lag/{roster.slug}/{season.slug}" class="text-accent-600 hover:underline">
					{roster.name}, {season.name}
				</a>
			</p>
		{/if}

		<Subheading>Rosters</Subheading>

		<Table
			class="mt-4 grid-cols-[1fr_160px_80px_170px]"
			rows={sortedMemberships}
			key={(value) => value.roster.id}
			columns={[
				{ label: 'Lag' },
				{ label: 'Säsong', center: true },
				{ label: 'Roll', center: true },
				{ label: 'Rank' }
			]}
		>
			{#snippet row({ value: membership })}
				{@const { roster, role, rank, tier, sr } = membership}
				{@const { division, season } = flattenGroup(roster.group)}
				{@const href = `/lag/${roster.slug}/${season.slug}`}

				<div class="gap-2 px-4 py-1.5 font-semibold">
					<RosterLogo id={roster.id} class="size-12" {href} />

					<a {href} class="hover:underline">
						{roster.name}
					</a>
				</div>

				<div class="justify-center text-base">
					{division.name}, {season.name}
				</div>

				<div class="justify-center gap-2 text-xl">
					<Icon icon={roleIcon(role)} title={role} />
				</div>

				<div class="text-base">
					{#if rank && tier}
						<Rank rank={{ rank, tier }} collapse />
					{:else if sr}
						<Rank rank={{ sr }} collapse />
					{/if}
				</div>
			{/snippet}
		</Table>
	</section>

	<section class="shrink-0 space-y-6 md:w-44">
		{#if canEditUserPage(data.user, data.player.battletag)}
			<Button
				href="/admin/spelare/{data.player.id}"
				label="Redigera"
				icon="ph:pencil-simple"
				kind="secondary"
			/>
		{/if}

		{#if data.player.pronouns}
			<Field title="Pronomen">
				{data.player.pronouns}
			</Field>
		{/if}

		{#if data.player.signatureHeroes.length > 0}
			<Field title="Signaturhjältar">
				<div class="mt-1 flex flex-wrap gap-1">
					{#each data.player.signatureHeroes as { hero }}
						<HeroPortrait name={hero.name} size="sm" />
					{/each}
				</div>
			</Field>
		{/if}

		{#if data.player.aliases}
			<Field title="Känd som">
				<div class="flex items-center gap-2">
					<Icon icon="ph:star" />
					{data.player.battletag}
				</div>

				{#each data.player.aliases as alias}
					<div>
						{alias.name}
					</div>
				{/each}
			</Field>
		{/if}

		{#if data.player.socials.length > 0}
			<Field title="Sociala medier">
				<div class="mt-1 flex items-center gap-3">
					{#each data.player.socials as { platform, url } (platform)}
						<TeamSocial class="text-3xl" {platform} href={url} />
					{/each}
				</div>
			</Field>
		{/if}
	</section>
</PageSection>
