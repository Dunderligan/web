<script lang="ts">
	import { DecisionPoint, nextDecisionPoint } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import MapPick from './MapPick.svelte';
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
	<Subheading>Dags att spela!</Subheading>
{:else if decisionPoint.point === DecisionPoint.BAN_ORDER}
	{#if isActing}
		<Subheading>Välj lag att banna först</Subheading>
	{:else}
		<Waiting />

		<Subheading>Väntar på att andra lag bannar</Subheading>
	{/if}
{:else if decisionPoint.point === DecisionPoint.FIRST_BAN}
	<div class="capitalize">Första bann</div>

	{#if isActing}
		<Subheading>Välj en hjälte att banna</Subheading>
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
	<div class="capitalize">Andra bann</div>

	{#if isActing}
		<Subheading>Välj en hjälte att banna</Subheading>
	{:else}
		<Waiting />

		<Subheading>Väntar på att andra lag bannar</Subheading>
	{/if}
{/if}
