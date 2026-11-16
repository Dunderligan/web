<script lang="ts">
	import { DecisionPoint, eligibleHeroes, type HeroCatalogEntry } from '$lib/pick-ban';
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
		const eligibleIds = new Set(
			eligibleHeroes({
				catalog: context.catalog.heroes,
				maps: context.state.maps,
				slot
			}).map((hero) => hero.id)
		);

		const heroes = new SvelteMap<Role, (HeroCatalogEntry & { eligible: boolean })[]>();

		for (const hero of context.catalog.heroes) {
			if (!heroes.has(hero.role)) {
				heroes.set(hero.role, []);
			}

			const eligible = eligibleIds.has(hero.id);
			heroes.get(hero.role)?.push({ ...hero, eligible });
		}

		return heroes;
	});

	let selectedRole = $derived(allRoles.find((role) => roleHasEligibleHeroes(role)));

	const shownHeroes = $derived.by(() => {
		const unsorted = selectedRole ? (heroesByRole.get(selectedRole) ?? []) : [];

		return unsorted.sort((a, b) => {
			return compare(a.eligible, b.eligible) || a.name.localeCompare(b.name);
		});
	});

	function roleHasEligibleHeroes(role: Role): boolean {
		const heroes = heroesByRole.get(role);
		return heroes?.some((hero) => hero.eligible) ?? false;
	}

	async function selectHero(heroId: string) {
		if (!interactive) return;

		await context.makeDecision({
			point: firstBan ? DecisionPoint.FIRST_BAN : DecisionPoint.SECOND_BAN,
			heroId
		});
	}
</script>

<div class={[classProp, 'w-full']}>
	<Tabs
		class="w-full"
		bind:selected={selectedRole}
		items={allRoles.map((role) => ({
			label: formatRole(role),
			value: role,
			disabled: !roleHasEligibleHeroes(role),
			icon: roleIcon(role)
		}))}
	/>

	<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
		{#each shownHeroes as { eligible, ...hero } (hero.id)}
			<button
				class="overflow-hidden rounded-lg bg-gray-100 not-disabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-80"
				disabled={!interactive || !eligible}
				onclick={() => selectHero(hero.id)}
			>
				<HeroPortrait {hero} size="md" class="w-full object-cover" />

				<div class="py-1.5">
					{hero.name}
				</div>
			</button>
		{/each}
	</div>
</div>
