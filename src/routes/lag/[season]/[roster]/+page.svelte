<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';
	import { authClient, isAdmin } from '$lib/auth-client';
	import { averageRank, sortRole as compareRole, flattenGroup } from '$lib/util';

	const session = authClient.useSession();

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { group, division, season } = $derived(flattenGroup(roster.group));

	let otherRosters = $derived(team.rosters.filter((other) => other.id !== roster.id));

	let sortedMembers = $derived(roster.members.toSorted((a, b) => compareRole(a.role, b.role)));
	let average = $derived(averageRank(roster.members));
</script>

<img src="{PUBLIC_CDN_ENDPOINT}/dunderligan/logos/{roster.id}.png" alt="" class="size-52" />

<h1 class="text-2xl font-bold">{roster.name}</h1>

<div class="flex items-center gap-4">
	{#each team.socials as social (social.platform)}
		<div>
			<a href={social.url} class="underline">{social.platform}</a>
		</div>
	{/each}
</div>

<div>
	Spelade i <a class="underline" href="/sasong/{season.slug}?div={division.slug}&grupp={group.slug}"
		>{division.name} {season.name}</a
	>
</div>

<div>
	{#each team.socials as social}
		<div>
			<a href={social.url}>{social.platform}</a>
		</div>
	{/each}
</div>

<div>
	{#each sortedMembers as member}
		<div>
			({member.role}) {member.player?.battletag}
			{member.rank}
			{member.tier}
			{#if member.isCaptain}
				- Kapten
			{/if}
		</div>
	{/each}
</div>

<div>
	Genomsnittlig rank: {average.rank}
	{average.tier}
</div>

<div>
	<h2 class="text-lg font-semibold">Senaste matcherna</h2>

	<div>
		{#each roster.matches as match (match.id)}
			{@const flipped = match.rosterB?.id === roster.id}

			<div class={[flipped && 'flex-row-reverse', 'flex max-w-max items-center gap-2']}>
				<div>
					<a class="underline" href="/lag/{season.slug}/{match.rosterA?.slug}"
						>{match.rosterA?.name}</a
					>
					({match.teamAScore})
				</div>

				<div>vs</div>

				<div>
					<a class="underline" href="/lag/{season.slug}/{match.rosterB?.slug}"
						>{match.rosterB?.name}</a
					>
					({match.teamBScore})
				</div>
			</div>
		{/each}
	</div>
</div>

<div>
	<h2 class="text-lg font-semibold">Andra rosters</h2>

	<div class="flex items-center gap-2">
		{#each otherRosters as roster (roster.id)}
			<div>
				<a href="roster.slug">{roster.group.division.season.name} {roster.group.division.name}</a>
			</div>
		{/each}
	</div>
</div>

{#if isAdmin($session.data?.user)}
	<div>
		<a href="/admin/roster/{roster.id}">Redigera</a>
	</div>
{/if}
