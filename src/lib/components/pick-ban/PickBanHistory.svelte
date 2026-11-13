<script lang="ts">
	import { matchRoster } from '$lib/match';
	import {
		DecisionPoint,
		MapOutcome,
		RoomStatus,
		type GamemodeCatalogEntry,
		type HeroCatalogEntry,
		type MapCatalogEntry,
		type RecordedDecision,
		type RoomMapState
	} from '$lib/pick-ban';
	import { bannedHeroId, outcomeToSlot, pickedMapId } from '$lib/pick-ban/util';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot, type MemberWithProfile } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import HeroPortrait from '../ui/HeroPortrait.svelte';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { formatTime } from '$lib/util';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();

	type DecisionEntry = {
		kind: 'decision';
		key: string;
		at: Date;
		decision: RecordedDecision;
	};

	type ResultEntry = {
		kind: 'result';
		key: string;
		at: Date | null;
		outcome: MapOutcome;
	};

	type HistoryEntry = DecisionEntry | ResultEntry;

	type MapHistory = {
		map: RoomMapState;
		entries: HistoryEntry[];
	};

	const history = $derived.by<MapHistory[]>(() => {
		return [...context.state.maps]
			.sort((a, b) => b.index - a.index)
			.map((map) => {
				const entries: HistoryEntry[] = map.decisions.map((decision, index) => ({
					kind: 'decision',
					key: `decision-${map.index}-${decision.point}-${index}`,
					at: decision.createdAt,
					decision
				}));

				if (map.outcome !== null) {
					entries.push({
						kind: 'result',
						key: `result-${map.index}`,
						at: map.resultRecordedAt ?? map.reports[0]?.submittedAt ?? null,
						outcome: map.outcome
					});
				}

				entries.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));

				return { map, entries };
			});
	});

	function mapById(id: string | null): MapCatalogEntry | null {
		if (!id) return null;
		return context.catalog.maps.find((map) => map.id === id) ?? null;
	}

	function heroById(id: string | null): HeroCatalogEntry | null {
		if (!id) return null;
		return context.catalog.heroes.find((hero) => hero.id === id) ?? null;
	}

	function gamemodeFor(map: MapCatalogEntry | null): GamemodeCatalogEntry | null {
		if (!map) return null;
		return context.gamemodes.find((gamemode) => gamemode.id === map.gamemodeId) ?? null;
	}

	function rosterFor(slot: MatchSlot) {
		return matchRoster(context.match, slot);
	}

	function avatarUrl(member: MemberWithProfile | null): string | null {
		if (member?.profile.status !== 'found') return null;
		return member.profile.profile.avatarUrl;
	}

	function isCurrentMap(map: RoomMapState): boolean {
		return context.status === RoomStatus.IN_PROGRESS && map.index === context.state.currentMapIndex;
	}

	function gamemodeIcon(gamemode: GamemodeCatalogEntry | null): string {
		switch (gamemode?.slug) {
			case 'control':
				return 'ph:flag-checkered';
			case 'escort':
				return 'ph:package';
			case 'flashpoint':
				return 'ph:lightning';
			case 'hybrid':
				return 'ph:map-trifold';
			case 'push':
				return 'ph:robot';
			case 'clash':
				return 'ph:swords';
			default:
				return 'ph:map-pin';
		}
	}

	function banOrderLabel(decision: RecordedDecision): string {
		const conceded = 'concede' in decision.value && decision.value.concede;
		return conceded ? 'Avstår första banen' : 'Bannar först';
	}

	function outcomeLabel(outcome: MapOutcome): string {
		const slot = outcomeToSlot(outcome);
		if (!slot) return 'Oavgjort';

		return `Map win till ${rosterFor(slot)?.name ?? 'okänt lag'}`;
	}
</script>

<div class={[classProp, 'rounded-xl border-[3px] border-gray-200 bg-white p-6']}>
	<div class="relative">
		<div
			class="absolute top-3 bottom-0 left-2.75 w-0.5 bg-gray-200 dark:bg-gray-700"
			aria-hidden="true"
		></div>

		<div class="space-y-8">
			{#each history as { map, entries } (map.index)}
				{@const current = isCurrentMap(map)}
				{@const completed = map.outcome !== null}

				<section>
					<div class="flex items-start gap-4">
						<span
							class={[
								'relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2',
								current
									? 'border-green-500 bg-green-100 dark:bg-green-950/60'
									: completed
										? 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'
										: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
							]}
							aria-hidden="true"
						>
							<span
								class={[
									'size-2.5 rounded-full',
									current
										? 'bg-green-500'
										: completed
											? 'bg-gray-500 dark:bg-gray-400'
											: 'bg-gray-300 dark:bg-gray-600'
								]}
							></span>
						</span>

						<div class="min-w-0 flex-1">
							<h3 class="text-lg font-semibold tracking-wide">MAP {map.index + 1}</h3>

							<div class="mt-3 space-y-3">
								{#each entries as entry (entry.key)}
									<div class="relative">
										<span
											class="absolute top-2.5 -left-10 z-10 flex size-6 justify-center"
											aria-hidden="true"
										>
											<span
												class="size-3 rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
											></span>
										</span>

										{#if entry.kind === 'decision'}
											{#if entry.decision.point === DecisionPoint.MAP_PICK}
												{@const pickedMap = mapById(pickedMapId(entry.decision))}
												{@const gamemode = gamemodeFor(pickedMap)}

												<div
													class="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
												>
													<div
														class="pointer-events-none absolute inset-y-0 right-0 w-2/3"
														aria-hidden="true"
													>
														{#if pickedMap}
															<img
																src="/maps/{pickedMap.slug}.webp"
																alt=""
																class="h-full w-full object-cover opacity-25"
															/>
														{/if}
														<div
															class="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent dark:from-gray-900 dark:via-gray-900/80"
														></div>
													</div>

													<div class="relative">
														{@render entryHeader(entry)}

														<div class="mt-2 flex items-center gap-3">
															<div class="relative shrink-0">
																{#if pickedMap}
																	<img
																		src="/maps/{pickedMap.slug}.webp"
																		alt={pickedMap.name}
																		class="h-16 w-28 rounded-md object-cover"
																	/>
																{:else}
																	<div
																		class="flex h-16 w-28 items-center justify-center rounded-md bg-gray-200 dark:bg-gray-800"
																	>
																		<Icon icon="ph:map-pin" class="text-2xl" />
																	</div>
																{/if}

																<span
																	class="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-white text-gray-700 shadow dark:bg-gray-100"
																>
																	<Icon
																		icon={gamemodeIcon(gamemode)}
																		class="text-xs"
																		title={gamemode?.name}
																	/>
																</span>
															</div>

															<span class="text-lg font-medium">
																{pickedMap?.name ?? 'Okänd map'} pick
															</span>
														</div>
													</div>
												</div>
											{:else if entry.decision.point === DecisionPoint.FIRST_BAN || entry.decision.point === DecisionPoint.SECOND_BAN}
												{@const hero = heroById(bannedHeroId(entry.decision))}

												<div class="min-w-0 flex-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
													{@render entryHeader(entry)}

													<div class="mt-2 flex items-center gap-3">
														<div class="relative shrink-0">
															{#if hero}
																<HeroPortrait {hero} size="sm" />
															{:else}
																<div
																	class="flex size-12 items-center justify-center rounded-md bg-gray-200 dark:bg-gray-800"
																>
																	<Icon icon="ph:question" class="text-xl" />
																</div>
															{/if}

															<span
																class="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-white ring-2 ring-gray-50 dark:ring-gray-900"
															>
																<Icon icon="ph:prohibited" class="text-[10px]" />
															</span>
														</div>

														<span class="text-lg font-medium">
															{hero?.name ?? 'Okänd hjälte'} ban
														</span>
													</div>
												</div>
											{:else}
												<div class="min-w-0 flex-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
													{@render entryHeader(entry)}

													<div class="mt-2 text-lg font-medium">
														{banOrderLabel(entry.decision)}
													</div>
												</div>
											{/if}
										{:else}
											{@const winnerSlot = outcomeToSlot(entry.outcome)}
											{@const winnerRoster = winnerSlot ? rosterFor(winnerSlot) : null}

											<div class="min-w-0 flex-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
												{@render entryHeader(entry)}

												<div class="mt-2 flex items-center gap-3">
													{#if winnerRoster}
														<RosterLogo id={winnerRoster.id} size={40} />
													{:else}
														<div
															class="flex size-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800"
														>
															<Icon icon="ph:equals" class="text-xl" />
														</div>
													{/if}

													<span class="text-lg font-medium">
														{outcomeLabel(entry.outcome)}
													</span>
												</div>
											</div>
										{/if}
									</div>
								{:else}
									<div class="relative">
										<span
											class="absolute top-0 -left-10 z-10 flex size-6 justify-center"
											aria-hidden="true"
										>
											<span
												class="size-3 rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
											></span>
										</span>

										<p class="text-sm text-gray-500 dark:text-gray-400">Inga beslut ännu.</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</section>
			{/each}
		</div>
	</div>
</div>

{#snippet entryHeader(entry: HistoryEntry)}
	<div
		class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-600 dark:text-gray-400"
	>
		{#if entry.kind === 'decision'}
			{@const roster = rosterFor(entry.decision.slot)}

			{@const actor = entry.decision.actor}
			{@const member = actor ? context.findMemberByBattletag(actor.battletag)?.member : null}

			{#if roster}
				<RosterLogo id={roster.id} size={20} />
			{/if}

			<span>
				{roster?.name ?? 'Okänt lag'}
			</span>

			<span class="h-4 w-px bg-gray-300 dark:bg-gray-700" aria-hidden="true"></span>

			{#if entry.decision.automatic}
				<Icon icon="ph:robot" class="text-base" />
				<span>Automatiskt</span>
			{:else if member}
				{@const avatar = member ? avatarUrl(member) : null}

				{#if avatar}
					<img src={avatar} alt="" class="size-5 rounded object-cover" />
				{/if}

				<span>{member.member.player.battletag.split('#')[0]}</span>
			{/if}

			<span class="h-4 w-px bg-gray-300 dark:bg-gray-700" aria-hidden="true"></span>
		{/if}

		{#if entry.at}
			<time datetime={entry.at.toISOString()}>{formatTime(entry.at)}</time>
		{/if}
	</div>
{/snippet}
