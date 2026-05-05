<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { canEditUserPage } from '$lib/authRole.js';
	import Match from '$lib/components/match/Match.svelte';
	import Field from '$lib/components/structure/Field.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ChipToggle from '$lib/components/ui/ChipToggle.svelte';
	import HeroPortrait from '$lib/components/ui/HeroPortrait.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import OverwatchProfile from '$lib/components/ui/OverwatchProfile.svelte';
	import Placement from '$lib/components/ui/Placement.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import TeamSocial from '$lib/components/ui/TeamSocial.svelte';
	import { claimPlayer } from '$lib/remote/player.remote.js';
	import { Role } from '$lib/types.js';
	import { flattenGroup, formatDateTime, roleIcon } from '$lib/util';

	let { data } = $props();

	let claimLoading = $state(false);

	let showMiscRoles = $derived(page.url.searchParams.get('coachroller') === 'true');
	let showSpinoffSeasons = $derived(page.url.searchParams.get('spinoff') === 'true');

	const memberships = $derived(data.player.memberships);

	const hasMiscRoles = $derived(memberships.some((m) => isMiscRole(m.role)));
	const hasSpinoffSeasons = $derived(
		memberships.some((m) => flattenGroup(m.roster.group).season.spinoff)
	);

	const sortedMemberships = $derived(
		memberships.toSorted((a, b) => {
			const aSeason = flattenGroup(a.roster.group).season;
			const bSeason = flattenGroup(b.roster.group).season;

			return bSeason.startedAt.getTime() - aSeason.startedAt.getTime();
		})
	);

	const filteredMemberships = $derived(
		sortedMemberships.filter(
			(m) =>
				(showMiscRoles || !isMiscRole(m.role)) &&
				(showSpinoffSeasons || !flattenGroup(m.roster.group).season.spinoff)
		)
	);

	const lastMembership = $derived(sortedMemberships.at(0));
	const anyRegisteredNames = $derived(memberships.some((m) => m.registeredName));

	const name = $derived(data.player.battletag.split('#')[0]);
	const hasFullTag = $derived(data.player.battletag.includes('#'));

	const profile = $derived(data.profile.status === 'found' ? data.profile.profile : null);

	const canClaim = $derived(data.user?.battletag.split('#')[0].toLowerCase() == name.toLowerCase());

	const achievements = $derived(
		filteredMemberships
			.filter((membership) => membership.placement !== null)
			.sort((a, b) => a.placement!.best - b.placement!.best)
	);

	async function onClaimClicked() {
		claimLoading = true;

		try {
			const { id } = await claimPlayer({
				battletag: data.player.battletag
			});

			await goto(`/admin/spelare/${id}`);
		} finally {
			claimLoading = false;
		}
	}

	function isMiscRole(role: Role) {
		return role === Role.COACH || role === Role.MANAGER;
	}
</script>

<Meta
	title={name}
	description={data.player.description ?? `Se information om spelaren ${name} i Dunderligan.`}
	ogImage={profile?.avatarUrl}
/>

<PageHeader>
	<OverwatchProfile {name} {profile} large hideLink />
</PageHeader>

<PageSection class="flex flex-col-reverse gap-10 md:flex-row">
	<section class="shrink grow">
		{#if !hasFullTag && canClaim}
			<Notice kind="info" class="mb-6">
				Är detta din profil?

				<Button
					label="Redigera"
					icon="ph:pencil-simple"
					kind="transparent"
					class="ml-auto shrink-0"
					onclick={onClaimClicked}
					loading={claimLoading}
				/>
			</Notice>
		{/if}

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

		{#if data.player.memberships.length === 0}
			<Notice kind="info">Inga rosters hittades för denna spelare.</Notice>
		{:else}
			<Subheading>Rosters</Subheading>

			<div class="mt-2 flex items-center gap-1">
				{#if hasSpinoffSeasons}
					<ChipToggle
						icon="ph:star"
						label="Andra turneringar"
						checked={showSpinoffSeasons}
						href="?spinoff={!showSpinoffSeasons}&coachroller={showMiscRoles}"
					/>
				{/if}
				{#if hasMiscRoles}
					<ChipToggle
						icon="ph:clipboard"
						label="Coachroller"
						checked={showMiscRoles}
						href="?spinoff={showSpinoffSeasons}&coachroller={!showMiscRoles}"
					/>
				{/if}
			</div>

			<Table
				class="mt-2 grid-cols-[auto_auto_1fr_40px_70px] sm:grid-cols-[1fr_auto_170px_50px_160px]"
				rows={filteredMemberships}
				key={(value) => value.roster.id}
				columns={[
					{ label: 'Lag' },
					{ label: anyRegisteredNames ? 'Spelade som' : '', center: true },
					{ label: 'Säsong', center: true },
					{ label: 'Roll', center: true },
					{ label: 'Rank' }
				]}
			>
				{#snippet row({ value: membership })}
					{@const { roster, role, rank, tier, sr, registeredName } = membership}
					{@const { division, season } = flattenGroup(roster.group)}
					{@const href = `/lag/${roster.slug}/${season.slug}`}

					<div class="gap-2 px-4 py-1.5 font-semibold">
						<RosterLogo id={roster.id} class="size-12" {href} />

						<a {href} class="hidden truncate hover:underline sm:inline">
							{roster.name}
						</a>
					</div>

					<div class="justify-center text-center text-base">
						{registeredName}
					</div>

					<div class="justify-center text-center text-base">
						<a href="/stallningar/{season.slug}?div={division.slug}" class="hover:underline">
							{division.name}, {season.name}
						</a>
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
		{/if}

		{#if achievements.length > 0}
			<Subheading class="mt-10">Bedrifter</Subheading>

			<Table
				class="mt-4 grid-cols-[auto_1fr_auto]"
				rows={achievements}
				key={(value) => value.roster.id}
				columns={[
					{ label: 'Placering' },
					{ label: 'Säsong', center: true },
					{ label: 'Resultat', center: true }
				]}
			>
				{#snippet row({ value: achievement })}
					{@const { roster, placement, finalMatch } = achievement}
					{@const { season, division } = flattenGroup(roster.group)}
					{@const bracket = finalMatch?.bracket}

					<div class="px-4">
						{#if placement}
							<Placement {...placement} />
						{/if}
					</div>

					<div class="justify-center text-center text-base">
						<a
							href="/stallningar/{season.slug}?div={division.slug}&visa=slutspel"
							class="hover:underline"
						>
							{bracket?.name}, {season.name}
						</a>
					</div>

					<div>
						{#if finalMatch}
							<Match
								match={finalMatch}
								seasonSlug={season.slug}
								mainRosterId={roster.id}
								size="xs"
							/>
						{/if}
					</div>
				{/snippet}
			</Table>
		{/if}

		<p class="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
			{#if data.profile.status === 'found'}
				Overwatchprofil hämtades automatiskt från Battle.net.
			{:else if data.profile.status === 'error'}
				Kunde inte hämta Overwatchprofil: {data.profile.error}.
			{:else if data.profile.status === 'missing'}
				Ingen offentlig Overwatchprofil hittades för denna battletag.
			{:else if data.profile.status === 'ambiguous'}
				Flera Overwatchprofiler matchade denna battletag.
			{/if}
			Senast hämtad {formatDateTime(new Date(data.profile.date))}.
		</p>
	</section>

	<section class="shrink-0 space-y-6 md:w-44">
		<div class="space-y-2">
			{#if canEditUserPage(data.user, data.player.battletag)}
				<Button
					href="/admin/spelare/{data.player.id}"
					label="Redigera"
					icon="ph:pencil-simple"
					kind="secondary"
				/>
			{/if}

			{#if data.profile.status === 'found'}
				<Button
					href="https://overwatch.blizzard.com/en-us/career/{data.profile.profile.slug}"
					target="_blank"
					rel="noopener noreferrer"
					label="Blizzard.com"
					icon="ph:arrow-square-out"
					kind="secondary"
				/>
			{/if}
		</div>

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
