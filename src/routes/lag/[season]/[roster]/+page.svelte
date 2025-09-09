<script lang="ts">
	import { averageRank, sortRole as compareRole } from '$lib/util';

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { group } = $derived(roster);
	let { division } = $derived(group);
	let { season } = $derived(division);

	let otherRosters = $derived(team.rosters.filter((other) => other.id !== roster.id));

	let sortedMembers = $derived(roster.members.toSorted((a, b) => compareRole(a.role, b.role)));
	let average = $derived(averageRank(roster.members));
</script>

<h1 class="text-2xl font-bold">{roster.name}</h1>

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
				<a href="/lag/{roster.slug}"
					>{roster.group.division.season.name} {roster.group.division.name}</a
				>
			</div>
		{/each}
	</div>
</div>
