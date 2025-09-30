<script lang="ts">
	import EditableMatch from '$lib/components/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import { RosterState } from '$lib/state/rosters.svelte.js';
	import { v4 as uuidv4 } from 'uuid';
	import { updateGroupMatches } from './page.remote.js';
	import { MatchType, type FullMatch } from '$lib/types.js';

	const { data } = $props();

	const { group } = $derived(data);

	const matches: FullMatch[] = $state(data.matches);

	const rosters = RosterState.get();

	function createMatch() {
		const match = {
			id: uuidv4(),
			groupId: data.group.id,
			type: MatchType.GROUP
		};
		matches.unshift(match);
		rosters.edit(matches[0]);
	}

	async function save() {
		await updateGroupMatches({
			groupId: group.id,
			matches
		});
	}
</script>

<div class="space-y-6">
	<button onclick={createMatch}> Skapa match </button>

	<div class="space-y-2">
		{#each matches as match, i (match.id)}
			<EditableMatch
				{match}
				ondelete={() => {
					matches.splice(i, 1);
				}}
			/>
		{/each}
	</div>

	<button onclick={save}> Spara </button>
</div>

<EditMatchDialog />
