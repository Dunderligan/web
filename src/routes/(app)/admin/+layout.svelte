<script lang="ts">
	import ConfirmDialog from '#lib/components/admin/ConfirmDialog.svelte';
	import Meta from '#lib/components/structure/Meta.svelte';
	import PageSection from '#lib/components/structure/PageSection.svelte';
	import { ConfirmContext } from '#lib/state/confirm.svelte.ts';

	let { children } = $props();

	ConfirmContext.set(new ConfirmContext());
</script>

<Meta title="Admin" />

<PageSection class="space-y-8">
	{@render children()}
</PageSection>

<ConfirmDialog />
