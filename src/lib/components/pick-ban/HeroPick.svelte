<script lang="ts">
	import {
		DecisionPoint,
		HeroEligibility,
		computeHeroEligibility,
		type HeroCatalogEntry
	} from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Tabs from '../ui/Tabs.svelte';
	import type { ClassValue } from 'svelte/elements';
	import { compare, formatRole, isHeroRole, roleIcon } from '$lib/util';
	import { Role, type MatchSlot } from '$lib/types';
	import HeroPortrait from '../ui/HeroPortrait.svelte';

	type Props = {
		interactive?: boolean;
		slot: MatchSlot;
		firstBan: boolean;
		class?: ClassValue;
	};

	let { interactive = true, slot, firstBan, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const allRoles = $derived(Object.values(Role).filter((role) => isHeroRole(role)));

	const heroesByRole = $derived.by(() => {
		const eligibilityById = new Map<string, HeroEligibility>(
			computeHeroEligibility({
				catalog: context.catalog.heroes,
				maps: context.state.maps,
				slot
			}).map((entry) => [entry.item.id, entry.eligibility])
		);

		const heroes = new SvelteMap<Role, (HeroCatalogEntry & { eligibility: HeroEligibility })[]>();

		for (const hero of context.catalog.heroes) {
			if (!heroes.has(hero.role)) {
				heroes.set(hero.role, []);
			}

			const eligibility = eligibilityById.get(hero.id) ?? HeroEligibility.ELIGIBLE;
			heroes.get(hero.role)?.push({ ...hero, eligibility });
		}

		return heroes;
	});

	let selectedRole = $derived(
		allRoles.find((role) => roleEligibility(role) === HeroEligibility.ELIGIBLE)
	);

	const shownHeroes = $derived.by(() => {
		const unsorted = selectedRole ? (heroesByRole.get(selectedRole) ?? []) : [];

		return unsorted.sort((a, b) => {
			return compare(a.eligibility, b.eligibility) || a.name.localeCompare(b.name);
		});
	});

	function roleEligibility(role: Role): HeroEligibility {
		const heroes = heroesByRole.get(role);
		if (!heroes) return HeroEligibility.ELIGIBLE;

		if (heroes.some((hero) => hero.eligibility === HeroEligibility.ELIGIBLE)) {
			return HeroEligibility.ELIGIBLE;
		}

		const ineligibilityReasons = new SvelteMap<HeroEligibility, number>();
		for (const hero of heroes) {
			const current = ineligibilityReasons.get(hero.eligibility) ?? 0;
			ineligibilityReasons.set(hero.eligibility, current + 1);
		}

		const topReason = [...ineligibilityReasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
		return topReason ?? HeroEligibility.ELIGIBLE;
	}

	async function selectHero(heroId: string) {
		if (!interactive) return;

		await context.makeDecision({
			point: firstBan ? DecisionPoint.FIRST_BAN : DecisionPoint.SECOND_BAN,
			heroId
		});
	}

	function formatEligibility(eligibility: HeroEligibility): string {
		switch (eligibility) {
			case HeroEligibility.ELIGIBLE:
				return 'Väljbar';
			case HeroEligibility.ALREADY_BANNED:
				return 'Redan bannad den här kartan';
			case HeroEligibility.PREVIOUSLY_BANNED:
				return 'Bannad av ditt lag på en tidigare karta';
			case HeroEligibility.SECOND_BAN_SAME_ROLE:
				return 'En hjälte med samma roll har bannats på den här kartan';
		}
	}
</script>

<div class={[classProp, 'w-full']}>
	<Tabs
		class="w-full"
		bind:selected={selectedRole}
		items={allRoles.map((role) => {
			const eligibility = roleEligibility(role);
			const disabled = eligibility !== HeroEligibility.ELIGIBLE;

			return {
				label: formatRole(role),
				value: role,
				disabled,
				icon: roleIcon(role),
				title: disabled ? formatEligibility(eligibility) : undefined
			};
		})}
	/>

	<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
		{#each shownHeroes as { eligibility, ...hero } (hero.id)}
			<button
				class="overflow-hidden rounded-lg bg-gray-100 not-disabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-900 dark:not-disabled:hover:bg-gray-800"
				disabled={!interactive || eligibility !== HeroEligibility.ELIGIBLE}
				onclick={() => selectHero(hero.id)}
				{...eligibility !== HeroEligibility.ELIGIBLE
					? { title: formatEligibility(eligibility) }
					: {}}
			>
				<HeroPortrait {hero} size="md" class="w-full object-cover" />

				<div class="py-1.5">
					{hero.name}
				</div>
			</button>
		{/each}
	</div>
</div>
