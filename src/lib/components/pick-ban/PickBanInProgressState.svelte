<script lang="ts">
	import { DecisionPoint, nextDecisionPoint } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import HeroPick from './HeroPick.svelte';
	import MapPick from './MapPick.svelte';
	import PickBanReporter from './PickBanReporter.svelte';
	import BanOrderPick from './BanOrderPick.svelte';
	import Waiting from './Waiting.svelte';

	const context = PickBanContext.get();

	const decisionPoint = $derived(
		nextDecisionPoint(context.config, context.state.maps, context.status)
	);

	const isActing = $derived(
		context.userIsCaptain && decisionPoint !== null && decisionPoint.slot === context.userSlot
	);
</script>

{#if decisionPoint === null}
	<PickBanReporter />
{:else if decisionPoint.point === DecisionPoint.BAN_ORDER}
	{#if isActing}
		<Subheading>Välj lag att banna först</Subheading>

		<BanOrderPick interactive={isActing} />
	{:else}
		<Waiting />

		<Subheading>Andra laget väljer first bann</Subheading>
	{/if}
{:else if decisionPoint.point === DecisionPoint.FIRST_BAN}
	<div>
		<div class="uppercase">Första ban</div>

		{#if isActing}
			<Subheading>Välj en hjälte att banna</Subheading>
		{/if}
	</div>

	{#if isActing}
		<HeroPick class="grow" interactive={isActing} firstBan={true} slot={decisionPoint.slot} />
	{:else}
		<Waiting />

		<Subheading>Väntar på att andra lag bannar</Subheading>
	{/if}
{:else if decisionPoint.point === DecisionPoint.MAP_PICK}
	{#if isActing}
		<Subheading>Välj en karta</Subheading>
	{/if}

	<MapPick class="grow" interactive={isActing} />
{:else if decisionPoint.point === DecisionPoint.SECOND_BAN}
	<div>
		<div class="uppercase">Andra ban</div>

		{#if isActing}
			<Subheading>Välj en hjälte att banna</Subheading>
		{/if}
	</div>

	{#if isActing}
		<HeroPick class="grow" interactive={isActing} firstBan={false} slot={decisionPoint.slot} />
	{:else}
		<Waiting />

		<Subheading>Väntar på att andra lag bannar</Subheading>
	{/if}
{/if}
