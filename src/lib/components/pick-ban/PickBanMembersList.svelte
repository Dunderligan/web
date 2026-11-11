<script lang="ts">
	import type { MemberWithProfile } from '$lib/types';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		members: MemberWithProfile[];
	};

	let { members }: Props = $props();
</script>

<div>
	{#each members as { member, profile } (member.player.id)}
		<div class="flex h-18 items-center gap-1.5 rounded-lg bg-gray-100 p-2 dark:bg-gray-900">
			{#if profile.status === 'found' && profile.profile.avatarUrl}
				<img src={profile.profile.avatarUrl} alt="Profilbild" class="h-full rounded-md" />
			{/if}

			<span class="mr-auto text-lg font-semibold">
				{member.player.battletag.split('#')[0]}
			</span>

			{#if member.isCaptain}
				<Icon icon="ph:crown-simple" class="mx-2 text-xl" title="Lagkapten" />
			{/if}
		</div>
	{/each}
</div>
