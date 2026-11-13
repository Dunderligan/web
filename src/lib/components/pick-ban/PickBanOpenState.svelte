<script lang="ts">
	import { matchRoster, matchSlots } from '$lib/match';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot } from '$lib/types';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import Waiting from './Waiting.svelte';

	const context = PickBanContext.get();

	function rosterName(slot: MatchSlot): string {
		return matchRoster(context.match, slot)?.name ?? (slot === MatchSlot.A ? 'Lag A' : 'Lag B');
	}
</script>

<div class="max-w-md">
	{#if context.userIsCaptain}
		<Subheading>Redo att börja?</Subheading>

		<div class="mt-2">
			När en kapten från bägge lag har bekräftat att de är redo startas matchen.
		</div>
	{:else}
		<Waiting />

		<div>Väntar på lagkaptener att bekräfta att de är redo...</div>
	{/if}
</div>

<div class="grid w-full max-w-md grid-cols-2 gap-3">
	{#each matchSlots() as slot (slot)}
		{@const ready = context.isTeamReady(slot)}

		<div
			class={[
				'rounded-lg p-3',
				ready && 'text-green-700 dark:text-green-400',
				ready ? 'bg-green-50 dark:bg-green-950/40' : 'bg-gray-50 dark:bg-gray-900'
			]}
		>
			<div class="font-semibold">{rosterName(slot)}</div>
			<div class="mt-1 flex items-center justify-center gap-2 text-sm font-medium">
				<Icon class="text-lg" icon={ready ? 'ph:check-circle' : 'ph:clock'} />
				<span>{ready ? 'Redo' : 'Inte redo'}</span>
			</div>
		</div>
	{/each}
</div>

{#if context.userIsCaptain}
	<div class="flex flex-col items-center gap-2">
		<Button
			kind={context.userTeamReady ? 'secondary' : 'primary'}
			icon={context.userTeamReady ? 'ph:arrow-counter-clockwise' : 'ph:check'}
			label={context.userTeamReady ? 'Ångra redo' : 'Vi är redo'}
			loading={context.readyPending}
			onclick={() => void context.setReady(!context.userTeamReady)}
		/>
	</div>
{/if}
