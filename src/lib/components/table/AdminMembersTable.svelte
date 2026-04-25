<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import { type Member, Rank as RankEnum, Role } from '$lib/types';
	import { capitalize, roleIcon } from '$lib/util';
	import Button from '../ui/Button.svelte';
	import Checkbox from '../ui/Checkbox.svelte';
	import InputField from '../ui/InputField.svelte';
	import Select from '../ui/Select.svelte';
	import Table from './Table.svelte';
	import Rank from '../ui/Rank.svelte';

	type Props = {
		legacyRanks: boolean;
		members: Member[];
		ondelete: (index: number) => void;
		disabled?: boolean;
	};

	let { legacyRanks, members = $bindable(), ondelete, disabled = false }: Props = $props();

	const saveCtx = SaveContext.get();
</script>

<Table
	rows={members}
	columns={[
		{ label: 'Battletag' },
		{ label: 'Kapten', center: true },
		{ label: 'Roll', center: true },
		{ label: 'Rank', center: true },
		{ label: '', center: true }
	]}
	class="grid-cols-[1fr_80px_160px_250px_50px]"
>
	{#snippet row({ value: member, index })}
		{@const hasRank = legacyRanks ? member.sr !== null : member.rank && member.tier}

		<div class="px-6 py-4 font-semibold">
			<a href="/admin/spelare/{member.player.id}" class="hover:underline">
				{#if member.registeredName}
					{member.registeredName} <span class="font-medium">({member.player.battletag})</span>
				{:else}
					{member.player.battletag}
				{/if}
			</a>
		</div>

		<div class="justify-center gap-2 pr-2">
			<Checkbox bind:checked={member.isCaptain} onCheckedChange={saveCtx.setDirty} {disabled} />
		</div>

		<div class="pr-4 text-base">
			<Select
				type="single"
				class="grow"
				bind:value={member.role}
				onValueChange={saveCtx.setDirty}
				itemIcon={(role) => roleIcon(role as Role)}
				items={Object.values(Role).map((role) => ({
					label: capitalize(role),
					value: role
				}))}
				{disabled}
			/>
		</div>

		<div class="gap-2 pr-2 text-base">
			{#if hasRank}
				{#if legacyRanks}
					<Rank rank={{ sr: member.sr ?? 0 }} hideLabel />

					<InputField
						type="number"
						oninput={saveCtx.setDirty}
						placeholder="SR"
						bind:value={
							() => (member.sr === 0 ? null : member.sr), (value) => (member.sr = value ?? 0)
						}
						{disabled}
					/>

					<Button
						kind="tertiary"
						icon="ph:x-circle"
						class="mr-2"
						title="Rensa rank"
						onclick={() => {
							member.sr = null;
							saveCtx.setDirty();
						}}
					/>
				{:else}
					<Select
						type="single"
						class="grow"
						onValueChange={saveCtx.setDirty}
						bind:value={
							() => member.rank! as string,
							(rank) => {
								if (rank) {
									member.rank = rank as RankEnum;
								} else {
									member.rank = null;
									member.tier = null;
								}
							}
						}
						items={Object.values(RankEnum).map((rank) => ({
							label: capitalize(rank),
							value: rank
						}))}
						canClear
						{disabled}
					>
						{#snippet itemSnippet({ value })}
							<Rank rank={{ rank: value as RankEnum, tier: 1 }} class="mr-2" hideLabel />
						{/snippet}
					</Select>

					<Select
						type="single"
						class="w-1/4"
						bind:value={() => member.tier!.toString(), (str) => (member.tier = parseInt(str))}
						onValueChange={saveCtx.setDirty}
						items={[1, 2, 3, 4, 5].map((tier) => ({
							label: tier.toString(),
							value: tier.toString()
						}))}
						{disabled}
					/>
				{/if}
			{:else}
				<Button
					label="Lägg till rank"
					icon="ph:plus"
					class="mx-auto"
					kind="tertiary"
					onclick={() => {
						if (legacyRanks) {
							member.sr = 0;
						} else {
							member.rank = RankEnum.BRONZE;
							member.tier = 1;
						}
						saveCtx.setDirty();
					}}
					{disabled}
				/>
			{/if}
		</div>

		<div class="pr-4">
			<Button
				title="Ta bort"
				icon="ph:trash"
				kind="tertiary"
				onclick={() => {
					ondelete(index);
					saveCtx.setDirty();
				}}
				{disabled}
			/>
		</div>
	{/snippet}
</Table>
