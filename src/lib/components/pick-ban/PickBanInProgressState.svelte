<script lang="ts">
	import { DecisionPoint } from '#lib/pick-ban/index.ts';
	import { PickBanContext } from '#lib/state/pick-ban.svelte.ts';
	import Subheading from '../ui/Subheading.svelte';
	import HeroPick from './HeroPick.svelte';
	import MapPick from './MapPick.svelte';
	import PickBanReporter from './PickBanReporter.svelte';
	import BanOrderPick from './BanOrderPick.svelte';
	import Waiting from './Waiting.svelte';
	import { matchRoster } from '#lib/match.ts';

	const context = PickBanContext.get();

	const isCaptain = $derived(context.userIsCaptain);

	const isActing = $derived(
		isCaptain && context.nextDecision !== null && context.nextDecision.slot === context.userSlot
	);

	const actingRoster = $derived.by(() => {
		if (context.nextDecision === null) {
			return null;
		}

		return matchRoster(context.match, context.nextDecision.slot);
	});

	const mapNumber = $derived(context.state.currentMapIndex + 1);

	const { label, heading: actionHeading } = $derived.by(() => {
		switch (context.nextDecision?.point) {
			case DecisionPoint.BAN_ORDER:
				return { label: null, heading: 'Välj lag att banna först' };
			case DecisionPoint.FIRST_BAN:
				return { label: 'Första ban', heading: 'Välj en hjälte att banna' };
			case DecisionPoint.MAP_PICK:
				return { label: 'Map pick', heading: 'Välj en karta' };
			case DecisionPoint.SECOND_BAN:
				return { label: 'Andra ban', heading: 'Välj en hjälte att banna' };
			default:
				return { label: null, heading: null };
		}
	});
</script>

{#if context.nextDecision === null}
	<PickBanReporter />
{:else}
	<div class="justify-self-start font-semibold">
		<p class="uppercase">
			MAP {mapNumber}
			{#if label}
				— {label}
			{/if}
		</p>

		{#if isActing && actionHeading}
			<Subheading>{actionHeading}</Subheading>
		{/if}
	</div>

	{#if context.nextDecision.point === DecisionPoint.BAN_ORDER}
		{#if isActing}
			<BanOrderPick />
		{:else}
			<Waiting text="{actingRoster?.name} väljer första ban" />
		{/if}
	{:else if context.nextDecision.point === DecisionPoint.FIRST_BAN}
		{#if isActing}
			<HeroPick class="grow" firstBan={true} slot={context.nextDecision.slot} />
		{:else}
			<Waiting text="{actingRoster?.name} bannar första hjälten" />
		{/if}
	{:else if context.nextDecision.point === DecisionPoint.MAP_PICK}
		{#if isActing}
			<MapPick class="grow" interactive={isActing} />
		{:else}
			<Waiting text="{actingRoster?.name} väljer karta" />
		{/if}
	{:else if context.nextDecision.point === DecisionPoint.SECOND_BAN}
		{#if isActing}
			<HeroPick
				class="grow"
				interactive={isActing}
				firstBan={false}
				slot={context.nextDecision.slot}
			/>
		{:else}
			<Waiting text="{actingRoster?.name} bannar andra hjälten" />
		{/if}
	{/if}
{/if}
