<script lang="ts">
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
</script>

<PageSection>
	<Notice kind="warn">
		Du verkar inte ha en spelarprofil kopplad till din Battletag.
		<br />
		För att ha en profil måste du spelat i ligan minst en säsong, samt blivit anmäld med den korrekta
		Battletagg:en.
	</Notice>
</PageSection>
