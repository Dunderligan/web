<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import { type Member, Rank as RankEnum, Role } from '$lib/types';
	import { capitalize, roleIcon } from '$lib/util';
	import Button from '../ui/Button.svelte';
	import Checkbox from '../ui/Checkbox.svelte';
	import Icon from '../ui/Icon.svelte';
	import InputField from '../ui/InputField.svelte';
	import Select from '../ui/Select.svelte';
	import Table from './Table.svelte';
	import Rank from '../ui/Rank.svelte';

	type Props = {
		legacyRanks: boolean;
		members: Member[];
		ondelete: (index: number) => void;
	};

	let { legacyRanks, members = $bindable(), ondelete }: Props = $props();

	const saveCtx = SaveContext.get();
</script>

<Table
	rows={members}
	columns={[{ label: 'Battletag', center: false }, 'Kapten', 'Roll', 'Rank', '']}
	class="grid-cols-[1fr_80px_160px_250px_50px]"
>
	{#snippet row({ value: member, index })}
		{@const hasRank = legacyRanks ? member.sr !== null : member.rank && member.tier}

		<div class="flex items-center bg-gray-200 px-6 py-4 text-lg font-semibold">
			{member.player.battletag}
		</div>

		<div class="flex items-center justify-center gap-2 bg-gray-200 pr-2">
			<Checkbox bind:checked={member.isCaptain} onCheckedChange={saveCtx.setDirty} />
		</div>

		<div class="flex items-center bg-gray-200 pr-4">
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
			/>
		</div>

		<div class="flex items-center gap-2 bg-gray-200 pr-2">
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
					/>

					<Button
						kind="tertiary"
						icon="ph:backspace"
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
								if (rank === 'clear') {
									member.rank = null;
									member.tier = null;
								} else {
									member.rank = rank as RankEnum;
								}
							}
						}
						items={[
							...Object.values(RankEnum).map((rank) => ({
								label: capitalize(rank),
								value: rank
							})),
							{ label: 'Rensa', value: 'clear' }
						]}
					>
						{#snippet itemSnippet({ value })}
							{#if value === 'clear'}
								<Icon icon="ph:backspace" class="-m-1 mr-2 h-full w-8" />
							{:else}
								<img src="/rank/{value}.png" alt={value} class="-m-1 mr-2 size-8" />
							{/if}
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
				/>
			{/if}
		</div>

		<div class="flex items-center bg-gray-200 pr-4">
			<Button
				title="Ta bort"
				icon="ph:trash"
				kind="tertiary"
				onclick={() => {
					ondelete(index);
					saveCtx.setDirty();
				}}
			/>
		</div>
	{/snippet}
</Table>
