<script lang="ts">
	import { getRoster } from '$lib/util';

	const { data } = $props();

	const { season, division, group, matches, rosters } = $derived(data);
</script>

<div class="space-y-6">
	<div>
		{#each matches as match (match.id)}
			{@const rosterA = getRoster(match.rosterAId, rosters)!}
			{@const rosterB = getRoster(match.rosterBId, rosters)!}

			<div>
				<a href="/admin/roster/{rosterA.id}">{rosterA.name}</a>
				{match.teamAScore}-{match.teamBScore}
				<a href="/admin/roster/{rosterB.id}">{rosterB.name}</a>
			</div>
		{/each}
	</div>
</div>
