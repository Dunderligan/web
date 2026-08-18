<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import {
		type AnyRank,
		type Member,
		type PlayerCheckin,
		Rank as RankEnum,
		Role
	} from '$lib/types';
	import {
		capitalize,
		compareRoles,
		formatDateTime,
		isOrganizationRole,
		isPlayerRole,
		ORGANIZATION_ROLES,
		roleIcon
	} from '$lib/util';
	import Button from '../ui/Button.svelte';
	import Checkbox from '../ui/Checkbox.svelte';
	import InputField from '../ui/InputField.svelte';
	import Select from '../ui/Select.svelte';
	import Table from './Table.svelte';
	import CreateDialog from '../admin/CreateDialog.svelte';
	import Label from '../ui/Label.svelte';
	import RankInput from '../ui/RankInput.svelte';
	import { isLegacyRank } from '$lib/rank';
	import Notice from '../ui/Notice.svelte';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		legacyRanks: boolean;
		members: Member[];
		memberLinks?: boolean;
		disabled?: boolean;
		forceRanks?: boolean;
		forceFullBattletag?: boolean;
		minPlayers?: number;
		maxPlayers?: number;
		minTeamCaptains?: number;
		maxTeamCaptains?: number;
		maxPlayersByRole?: { [role in Role]?: number };
		invalid?: boolean;
		showCheckins?: boolean;
		checkins?: Map<string, PlayerCheckin>;
	};

	let {
		legacyRanks,
		members = $bindable(),
		memberLinks,
		disabled = false,
		forceRanks = false,
		forceFullBattletag = false,
		minPlayers,
		maxPlayers,
		minTeamCaptains,
		maxTeamCaptains,
		maxPlayersByRole,
		invalid = $bindable(false),
		showCheckins = false,
		checkins = new Map()
	}: Props = $props();

	const saveCtx = SaveContext.get();

	const sortedMembers = $derived(
		members.toSorted((a, b) => {
			return compareRoles(a.role, b.role) || a.player.battletag.localeCompare(b.player.battletag);
		})
	);

	const players = $derived(members.filter((member) => !isOrganizationRole(member.role)));
	const hasMaxPlayers = $derived(maxPlayers !== undefined && players.length >= maxPlayers);
	const hasTooFewPlayers = $derived(minPlayers !== undefined && players.length < minPlayers);

	const teamCaptains = $derived(members.filter((member) => member.isCaptain));
	const hasMaxTeamCaptains = $derived(
		maxTeamCaptains !== undefined && teamCaptains.length >= maxTeamCaptains
	);
	const hasTooFewCaptains = $derived(
		minTeamCaptains !== undefined && teamCaptains.length < minTeamCaptains
	);

	const hasMaxMembers = $derived(
		Object.values(Role).every((role) => isRoleFilled(role)) ||
			(hasMaxPlayers && ORGANIZATION_ROLES.every((role) => isRoleFilled(role)))
	);

	let newPlayerOpen = $state(false);
	let newPlayerBattletag = $state('');
	let newPlayerRole = $state(Role.DAMAGE);
	let newPlayerRank: AnyRank | null = $state(defaultRank());
	let newPlayerCaptain = $state(false);

	const FULL_BATTLETAG_REGEX = /^[^#\ ]+#[0-9]{4,6}$/;

	let newPlayerBattletagAlreadyExists = $state(false);
	let newPlayerHasFullBattletag = $state(true);

	const newPlayerValid = $derived(
		newPlayerBattletag.trim().length > 0 &&
			!newPlayerBattletagAlreadyExists &&
			(!forceFullBattletag || newPlayerHasFullBattletag) &&
			!isRoleFilled(newPlayerRole) &&
			(!isPlayerRole(newPlayerRole) || !hasMaxPlayers)
	);

	$effect(() => {
		// These are the only two conditions that can make the table invalid,
		// whereas the others are enforced by the UI.
		invalid = hasTooFewCaptains || hasTooFewPlayers;
	});

	async function addNewPlayer() {
		let rank = isOrganizationRole(newPlayerRole) && forceRanks ? null : newPlayerRank;

		const rankFields =
			rank === null
				? { rank: null, tier: null, sr: null }
				: isLegacyRank(rank)
					? { rank: null, tier: null, sr: rank.sr }
					: { rank: rank.rank, tier: rank.tier, sr: null };

		members.push({
			isCaptain: newPlayerCaptain,
			role: newPlayerRole,
			registeredName: null,
			player: {
				id: null, // the backend will either link this up with an existing player, or create a new one
				battletag: newPlayerBattletag.trim()
			},
			...rankFields
		});

		saveCtx.setDirty();
		resetNewPlayer();
	}

	function resetNewPlayer() {
		newPlayerOpen = false;
		newPlayerBattletag = '';
		newPlayerRole = Role.DAMAGE;
		newPlayerRank = defaultRank();
		newPlayerCaptain = false;

		newPlayerBattletagAlreadyExists = false;
		newPlayerHasFullBattletag = true;
	}

	function defaultRank(): AnyRank {
		if (legacyRanks) {
			return { sr: 0 };
		} else {
			return { rank: RankEnum.BRONZE, tier: 1 };
		}
	}

	function getRank(member: Member): AnyRank | null {
		if (legacyRanks) {
			if (member.sr === null) {
				return null;
			}
			return { sr: member.sr ?? 0 };
		} else {
			if (!member.rank || !member.tier) {
				return null;
			}
			return { rank: member.rank ?? RankEnum.BRONZE, tier: member.tier ?? 1 };
		}
	}

	function setRank(member: Member, rank: AnyRank | null) {
		if (rank === null) {
			member.rank = null;
			member.tier = null;
			member.sr = null;
			return;
		}

		if (isLegacyRank(rank)) {
			member.sr = rank.sr;
		} else {
			member.rank = rank.rank;
			member.tier = rank.tier;
		}
	}

	function isRoleFilled(role: Role): boolean {
		if (!maxPlayersByRole) {
			return false;
		}

		const roleCount = members.filter((member) => member.role === role).length;
		const roleLimit = maxPlayersByRole[role] ?? Infinity;

		return roleCount >= roleLimit;
	}

	function validateNewPlayerName(isOnInput: boolean) {
		const trimmed = newPlayerBattletag.trim();
		if (trimmed.length === 0) {
			newPlayerBattletagAlreadyExists = false;
			newPlayerHasFullBattletag = true;
			return;
		}

		const alreadyExists = members.some((member) => member.player.battletag === trimmed);
		const hasFullBattletag = FULL_BATTLETAG_REGEX.test(trimmed);

		// Only set the error states if the user is not actively typing, to allow flickering errors
		if (!isOnInput || (isOnInput && !alreadyExists)) {
			newPlayerBattletagAlreadyExists = alreadyExists;
		}
		if (!isOnInput || (isOnInput && hasFullBattletag)) {
			newPlayerHasFullBattletag = hasFullBattletag;
		}
	}
</script>

<div>
	<Table
		rows={sortedMembers}
		columns={[
			...(showCheckins ? [{ label: 'Incheck', center: true }] : []),
			{ label: 'Battletag' },
			{ label: 'Kapten', center: true },
			{ label: 'Roll', center: true },
			{ label: 'Rank', center: true },
			{ label: '', center: true }
		]}
		class={showCheckins
			? 'grid-cols-[80px_1fr_80px_160px_250px_auto]'
			: 'grid-cols-[1fr_80px_160px_250px_auto]'}
		noBackground
	>
		{#snippet row({ value: member, index })}
			<div class="px-6 py-4 font-semibold">
				{#if showCheckins}
					{@const checkin = member.player.id ? checkins.get(member.player.id) : null}

					<div class="justify-center text-xl">
						{#if checkin}
							<Icon
								icon="ph:check-circle-fill"
								class="text-green-600"
								title="Incheckad {formatDateTime(checkin.checkedInAt)}"
							/>
						{:else}
							<Icon icon="ph:x-circle-fill" class="text-red-600" title="Inte incheckad" />
						{/if}
					</div>
				{/if}

				<svelte:element
					this={memberLinks ? 'a' : 'div'}
					href={memberLinks ? `/admin/spelare/${member.player.id}` : undefined}
					class={[memberLinks && 'hover:underline']}
				>
					{#if member.registeredName}
						{member.registeredName} <span class="font-medium">({member.player.battletag})</span>
					{:else}
						{member.player.battletag}
					{/if}
				</svelte:element>
			</div>

			<div class="justify-center gap-2 pr-2">
				{@render captainCheckbox({
					checked: member.isCaptain,
					onCheckedChange: (newValue) => {
						member.isCaptain = newValue;
						saveCtx.setDirty();
					}
				})}
			</div>

			<div class="pr-4 text-base">
				{@render roleSelect({
					role: member.role,
					onRoleChange: (newRole) => {
						member.role = newRole;
						if (forceRanks) {
							if (isOrganizationRole(newRole)) {
								setRank(member, null);
							} else if (!getRank(member)) {
								setRank(member, defaultRank());
							}
						}
						saveCtx.setDirty();
					},
					disableFilledRoles: true
				})}
			</div>

			<div class="gap-2 pr-2 text-base">
				{@render rankInput({
					rank: getRank(member),
					onValueChange: (newRank) => {
						setRank(member, newRank);
						saveCtx.setDirty();
					}
				})}
			</div>

			<div class="pr-4">
				<Button
					title="Ta bort"
					icon="ph:trash"
					kind="tertiary"
					onclick={() => {
						members.splice(index, 1);
						saveCtx.setDirty();
					}}
					{disabled}
				/>
			</div>
		{/snippet}
	</Table>

	{#if !disabled}
		<Button
			kind="primary"
			icon="ph:plus"
			label="Lägg till spelare"
			class="mt-4"
			onclick={() => (newPlayerOpen = true)}
			disabled={hasMaxMembers}
		/>
	{/if}

	{#if hasTooFewPlayers}
		<Notice kind="error" class="mt-2">
			Ditt lag måste ha minst {minPlayers} spelare.
		</Notice>
	{/if}

	{#if hasTooFewCaptains}
		<Notice kind="error" class="mt-2">
			Ditt lag måste ha minst {minTeamCaptains} lagkapten{(minTeamCaptains ?? 0 > 1) ? 'er' : ''}.
		</Notice>
	{/if}

	{#if hasMaxPlayers}
		<Notice kind="info" class="mt-2">
			Ditt lag har nått det maximala antalet spelare ({maxPlayers}).
		</Notice>
	{/if}
</div>

<CreateDialog
	title="Lägg till spelare"
	bind:open={newPlayerOpen}
	oncreate={addNewPlayer}
	onclose={resetNewPlayer}
	disabled={!newPlayerValid}
	createLabel="Lägg till"
>
	<Label label="Battletag">
		<InputField
			bind:value={newPlayerBattletag}
			placeholder="Spelare#1234"
			onenter={addNewPlayer}
			oninput={() => validateNewPlayerName(true)}
			onblur={() => validateNewPlayerName(false)}
		/>
	</Label>

	<Label label="Roll">
		{@render roleSelect({
			role: newPlayerRole,
			onRoleChange: (newRole) => (newPlayerRole = newRole)
		})}
	</Label>

	{#if !isOrganizationRole(newPlayerRole) || !forceRanks}
		<Label label="Rank">
			{@render rankInput({
				rank: newPlayerRank,
				onValueChange: (newRank) => (newPlayerRank = newRank)
			})}
		</Label>
	{/if}

	<Label label="Lagkapten">
		{@render captainCheckbox({
			checked: newPlayerCaptain,
			onCheckedChange: (newValue) => (newPlayerCaptain = newValue)
		})}
	</Label>

	{#if isRoleFilled(newPlayerRole)}
		<Notice kind="error">
			Det finns redan det maximala antalet medlemmar med rollen {capitalize(newPlayerRole)} ({maxPlayersByRole?.[
				newPlayerRole
			]}).
		</Notice>
	{/if}

	{#if isPlayerRole(newPlayerRole) && hasMaxPlayers}
		<Notice kind="error">
			Det finns redan det maximala antalet spelare ({maxPlayers}).
		</Notice>
	{/if}

	{#if newPlayerBattletagAlreadyExists}
		<Notice kind="error">Spelaren är redan tillagd.</Notice>
	{/if}

	{#if forceFullBattletag && !newPlayerHasFullBattletag}
		<Notice kind="error">Battletag måste vara i formatet Spelare#1234 eller Spelare#12345.</Notice>
	{/if}
</CreateDialog>

{#snippet roleSelect({
	role,
	onRoleChange,
	disabled,
	disableFilledRoles
}: {
	role: Role;
	onRoleChange: (newRole: Role) => void;
	disabled?: boolean;
	disableFilledRoles?: boolean;
})}
	<Select
		type="single"
		class="grow"
		value={role}
		onValueChange={(newRole) => onRoleChange(newRole as Role)}
		itemIcon={(role) => roleIcon(role as Role)}
		items={Object.values(Role).map((role) => ({
			label: capitalize(role),
			value: role,
			disabled: disableFilledRoles && isRoleFilled(role)
		}))}
		{disabled}
	/>
{/snippet}

{#snippet rankInput({
	rank,
	onValueChange
}: {
	rank: AnyRank | null;
	onValueChange: (newRank: AnyRank | null) => void;
})}
	{#if rank}
		<RankInput
			{rank}
			onValueChange={(newRank) => {
				onValueChange(newRank);
			}}
			onClear={() => {
				onValueChange(null);
			}}
			canClear={!forceRanks}
			{disabled}
		/>
	{:else if !forceRanks}
		<Button
			label="Lägg till rank"
			icon="ph:plus"
			class="mx-auto"
			kind="tertiary"
			onclick={() => {
				onValueChange(defaultRank());
			}}
			{disabled}
		/>
	{/if}
{/snippet}

{#snippet captainCheckbox({
	checked,
	onCheckedChange
}: {
	checked: boolean;
	onCheckedChange: (newValue: boolean) => void;
})}
	<Checkbox
		{checked}
		{onCheckedChange}
		disabled={disabled || (hasMaxTeamCaptains && !checked)}
		{...hasMaxTeamCaptains && !checked
			? { title: `Det finns redan det maximala antalet lagkaptener (${maxTeamCaptains})` }
			: {}}
	/>
{/snippet}
