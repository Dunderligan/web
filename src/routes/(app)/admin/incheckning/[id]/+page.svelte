<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminRosterList from '$lib/components/admin/AdminRosterList.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import ChipToggle from '$lib/components/ui/ChipToggle.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';

	const { data } = $props();

	const season = $derived(data.season);

	let showCompleteRosters = $state(false);

	const rostersWithCheckinPercent = $derived(
		data.rosters.map((roster) => ({
			roster,
			checkedInPercent:
				roster.members.filter((member) => data.checkins.has(member.player.id)).length /
				roster.members.length
		}))
	);

	const completeRosters = $derived(
		rostersWithCheckinPercent.filter(({ checkedInPercent }) => checkedInPercent >= 1)
	);

	const shownRosters = $derived(
		rostersWithCheckinPercent
			.filter(({ checkedInPercent }) => {
				if (showCompleteRosters) {
					return true;
				}
				return checkedInPercent < 1;
			})
			.toSorted((a, b) => {
				return (
					b.checkedInPercent - a.checkedInPercent || a.roster.name.localeCompare(b.roster.name)
				);
			})
			.map(({ roster, checkedInPercent: _ }) => roster)
	);
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: 'Incheckning', href: `/admin/checkin/${season.id}` }
	]}
/>

<AdminCard title="Statistik">
	<Progress
		max={data.totalPlayerCount}
		value={data.checkins.size}
		label="Incheckade spelare:"
		color="accent"
	/>

	<Progress
		max={data.rosters.length}
		value={completeRosters.length}
		label="Incheckade lag:"
		color="accent"
	/>
</AdminCard>

<AdminCard title="Lag">
	<ChipToggle bind:checked={showCompleteRosters} label="Visa incheckade" icon="ph:check-circle" />

	<AdminRosterList
		rosters={shownRosters}
		emptyText={showCompleteRosters ? 'Alla lag har checkat in!' : 'Inga lag att visa'}
		hideCreateButton
		showCheckins
		checkins={data.checkins}
	/>
</AdminCard>
