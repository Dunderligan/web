# Live pick and ban — implementation plan

Status: draft for review
Source: [feature description](./live-pick-and-ban.md) and [requirements](./live-pick-and-ban-requirements.md)
Scope: implementation roadmap. Detailed schema, protocol and rule-engine APIs are decided per phase, not in this document.

## 1. Summary

Build a room per eligible match in which two captains, in a server-enforced order, pick maps and ban heroes, confirm readiness, and report per-map results. The room is authoritative: it owns deadlines, validates every action, records an append-only decision log, and writes the final result back to the match.

The feature is additive. Teams that pick and ban manually are unaffected, rooms are optional, and no existing match flow is replaced except the final score writeback for rooms that are used.

## 2. Locked decisions

| Area              | Decision                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Realtime          | SvelteKit `query.live` per room, with in-process fan-out plus periodic database reconciliation.                                |
| Topology          | One Node process for now. Realtime and scheduling hide behind interfaces so a multi-instance variant can be added later.       |
| Background work   | An in-process sweeper started from `ServerInit`, with database-backed idempotent claims.                                       |
| Rule config       | Dedicated scoped tables (division, bracket, round) resolved by closest-parent fallback, plus an admin settings UI.             |
| Presence          | Redis keys with heartbeat TTL. In-memory fallback when `REDIS_URL` is unset, documented as single-instance only.               |
| Map catalogue     | New `gamemode` and `map` tables, seeded by a generated migration.                                                              |
| Seed dependency   | Depend on `roster.initialSeed` from the forthcoming `initial-seeds` work. Bracket placements are derived from group standings. |
| Delivery          | Six reviewable phases, covering the full requirements set.                                                                     |
| Default state     | Pick and ban is disabled unless configuration enables it for the match.                                                        |
| Default timeout   | 60 seconds per decision point, applied uniformly unless configured otherwise.                                                  |
| Inactive deletion | The room is deleted 60 minutes after scheduled start if the initial readiness check is not completed.                          |

## 3. Architecture

### 3.1 State and authority

- A room is a persisted state machine. Every action is a remote `command` that is validated on the server, committed in a transaction, and appended to the decision log.
- Clients never compute authority. They render a snapshot and countdown derived from a server deadline.
- The state machine is implemented as pure transitions in `src/lib/live-pick-and-ban/`:
  - `resolveConfig(match, configs)` — applicable rules and defaults.
  - `firstBanTeam(roomMaps, seeds, config)` — §6.1 determination.
  - `eligibleMaps(state, config)` and `eligibleHeroes(state, config)` — pool and ban eligibility.
  - `nextDecisionPoint(state)` — the single open decision point.
  - `applyDecision(state, decision, now)` — returns the next state or a rejection reason.
- Keeping transitions pure makes the rule-heavy parts unit-testable without a database, and gives the sweeper and command handlers one code path.

### 3.2 Reading the room

- Room state is exposed as a live remote query (`roomState(id) = query.live(...)`) in `src/lib/remote/room.remote.ts`.
- During SSR the query yields its first value, which SvelteKit serializes into the page and reuses during hydration, so guests and crawlers see state without JavaScript.
- After hydration the same query keeps a streaming connection open and re-renders the room whenever a new value is yielded.
- `+page.server.ts` is kept for static concerns only: 404s, hidden-season visibility and the match context. The live query performs the same visibility check so it cannot be used to bypass them.
- Everyone, including unauthenticated visitors, may call the query. It returns only public room data.

### 3.3 Realtime

- `roomState` is an async generator passed to `query.live`. It yields a public room snapshot and the room's version.
- A per-room channel fans updates out to all generators for that room:
  - every committed transition increments `room.version` in the same transaction and, after commit, calls `publish(roomId)`;
  - `publish` loads the public snapshot once and broadcasts it, so one decision costs one extra read regardless of how many viewers are connected;
  - subscribers yield the broadcast snapshot directly instead of querying per viewer;
  - a per-room ticker compares the last published version with `room.version` every two seconds as a self-healing backstop for missed publishes, sweeper transitions and future multi-process setups.
- The generator yields at least every 15 seconds even when nothing changes, so intermediaries do not time out the stream.
- The generator terminates when the room is finished, cancelled or deleted, which ends the stream and sets the client resource's `done` state.
- Reconnection is handled by SvelteKit: it retries with exponential backoff, exposes `connected`, and starts a fresh generator on reconnect, which yields a current snapshot first.
- Because the channel publishes after commit, commands do not need to call `reconnect()`; the acting client receives the change on its existing stream.
- No custom SSE route or EventSource plumbing is needed. The live query runs over SvelteKit's streaming fetch response; make sure proxy buffering is disabled and that service-worker caching excludes these responses.

### 3.4 Scheduling and deadlines

- The sweeper ticks every five seconds and does three indexed jobs:
  1. Create rooms for eligible matches whose scheduled start is at most 15 minutes away.
  2. Apply fallbacks for decision points whose deadline has passed.
  3. Delete rooms with no activity after scheduled start plus the grace period.
- Only matches in the scheduled state with two confirmed rosters in a public season are eligible. For other matches, admins are still able to manually start a pick ban room.
- Each job claims work with a conditional update (`where deadline <= now and decision is null`) and runs in a transaction, so a captain submission racing a fallback produces exactly one recorded decision.
- `room.nextDeadlineAt` is indexed, so the sweeper does not scan all rooms.
- Deadlines are stored as absolute timestamps derived from the database clock. Reloading a client cannot move them.
- The sweeper is started once from `ServerInit` and stopped on shutdown. A Postgres advisory lock is taken so a second accidental process does not double-run it.
- Sweeper transitions that change room state call `publish(roomId)` after commit, so connected live queries see automatic decisions immediately.

### 3.5 Presence and ready check

- Presence is stored in Redis as room-scoped keys with a 45-second TTL, refreshed by a 15-second `presenceHeartbeat` command from the room client.
- Presence is registered by an explicit client command, never by the live query generator, since the generator's first iteration also runs during SSR and would otherwise mark every crawler as connected.
- When `REDIS_URL` is absent, an in-memory store with the same interface is used and a warning is logged.
- A roster member is "connected" while at least one of their heartbeats is live. Captains are connected roster members with `member.isCaptain`.
- Ready state is per team, not per captain. All connected captains may ready the team. Readiness is withdrawn when no captain of that team remains connected.
- The room starts only when both teams are ready. There is no ready-check timeout; an admin cancels if the match is abandoned.

### 3.6 Authorization

- Extend the remote-function guards with room-specific checks:
  - `roomGuard(id)` — room exists and is readable, including for guests.
  - `captainGuard(room, slot)` — signed-in user with `isCaptain` on the roster in that slot.
  - `canAct(room, slot, decisionPoint)` — state-machine check, not only a role check.
- Admin commands use the existing `roleGuard(AuthRole.ADMIN)` and are logged with the acting user.
- Every captain action is scoped to their own slot; the client never supplies the acting team.

### 3.7 Result writeback

- On finish, one transaction writes the final score aggregate to `match.teamAScore`, `match.teamBScore`, `match.draws`, marks the match played, and closes the room. Only the aggregates are written back; for now, per-game results remain only in the room model.
- Per-map results and bans stay in the room tables and the archive; the match continues to store only the aggregate it stores today.
- Editing a finished match score outside the room remains possible for admins, as today. Divergence is visible in the room archive and is out of scope to prevent.

## 4. Conceptual data model

Names are indicative; the migration decides the final shape.

| Entity            | Purpose                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `gamemode`        | Slug, name, whether it is active.                                                                        |
| `map`             | Slug, name, gamemode reference, active flag.                                                             |
| `pick_ban_config` | Nullable `divisionId`, `bracketId`, `round`; all rule knobs from §4.2; closest-parent resolution.        |
| `room`            | Match reference, state, version, config snapshot, current map index, deadline, close reason, timestamps. |
| `room_map`        | One row per played map: index, map, first-ban slot, outcome, report state, completion time.              |
| `room_decision`   | Append-only: room map, decision point, acting slot, captain or automatic, value, created at.             |
| `room_report`     | Per captain per map: winner or draw, optional score, submitted at, resolved-by admin.                    |
| `room_presence`   | Not persisted. Redis only.                                                                               |

Constraints worth calling out now:

- A partial unique index guarantees at most one active room per match.
- A unique constraint on `(room_map_id, decision_point)` guarantees one recorded decision per point.
- Decisions are never updated or deleted; admin overrides create new decisions or report rows.
- Config is snapshotted onto the room at creation, so later configuration edits do not rewrite history.

## 5. Rule resolution

- Scope keys are `(division, bracket, round)`.
- Resolution order: exact applicable scope, then division default, then global default. A documented default exists for every knob.
- Required defaults: pick and ban disabled, 60-second timeout, random fallback for bans and picks, concede allowed, no fixed map pool, gamemode restriction off, fixed pool off.
- Bracket matches need a group-stage placement. Snapshot it at room creation using the existing `calculateStandings` over the division's group matches, so later corrections do not retroactively change a live room's first-ban team.
- Group matches use `roster.initialSeed` on the first map. If the dependency is missing at runtime, room creation fails loudly rather than guessing.

## 6. Phased roadmap

Each phase ends with `pnpm check`, `pnpm test`, `pnpm lint`, and an updated relevant doc. Phases are independently reviewable and leave the app deployable.

### Phase 1 — Foundation, catalogue and rules

Goal: all rule-heavy logic exists and is proven, with no user-facing change.

- Rebase/merge the `initial-seeds` dependency and confirm `roster.initialSeed` is available.
- Add `gamemode` and `map` tables and a migration seeding the current competitive pool.
- Add the room, room-map, decision, report and config tables, indexes and constraints.
- Implement config resolution and pure state-machine transitions with exhaustive Vitest coverage:
  - first-ban determination for group, bracket, winner and draw cases;
  - map eligibility, fixed pools, gamemode restriction and refresh;
  - ban history, role restriction and concede semantics;
  - win conditions for first-to-N and fixed-N, including draws;
  - timeout fallbacks and automatic decisions.
- Seed a disabled default configuration and document all defaults.
- **Done when:** tests cover every rule in §6–§8 of the requirements, the schema is pushed locally, and no existing page changes.

### Phase 2 — Rooms and admin lifecycle

Goal: rooms exist, can be inspected without JavaScript, and can be managed by admins.

- Room service: eligibility check, config snapshot, seeded first map, archive retrieval.
- Sweeper jobs for creation (15-minute lead) and inactive deletion (60-minute grace).
- Admin commands: create for a chosen match, cancel, list. Cancellation retains decisions and marks the room closed.
- `GET /pick-ban` list page and `GET /pick-ban/[id]` read-only page showing state, teams, configuration summary, map history and decision log.
- Respect hidden-season filters; never auto-create rooms for hidden or ineligible matches.
- **Done when:** acceptance criteria 1–6 and 48 pass, and an unauthenticated visitor can load a room URL.

### Phase 3 — Live updates, presence and ready check

Goal: both teams can meet in the room and start it.

- `roomState` live query, per-room update channel, version reconciliation and reconnect behaviour.
- Presence service (Redis with TTL, in-memory fallback), heartbeat command from the room client, connected/disconnected indicators per team.
- Surface live-query `connected` state in the room UI for the viewer's own connection, distinct from participant presence.
- Ready check for captains, both-teams requirement, readiness withdrawal when the last captain disconnects, no automatic start.
- Client countdown driven by the server deadline, not local timers.
- Accessibility pass for the room shell: keyboard reachable controls, visible focus, state not conveyed by colour alone, mobile and dark/light parity.
- **Done when:** acceptance criteria 34–38, 44 and 47 pass, including a reload during presence and an expired deadline shown correctly after reload.

### Phase 4 — Decisions and timeouts

Goal: a map can be picked and banned end to end.

- Commands for map pick, ban-order concession and hero ban, all guarded by `captainGuard` and `canAct`.
- Fixed-pool path that skips the pick and displays the predetermined map.
- Game-mode refresh and ban-history enforcement on the server, with server-side rejection of invalid choices.
- Deadline scheduling and sweeper fallbacks, recorded as automatic decisions.
- Optimistic concurrency: a captain submission and the fallback race resolves to exactly one decision. Duplicate submissions are idempotent.
- Decision log UI showing actor, value, timestamp and automatic marker; live update on every decision.
- Admin override for a stuck decision point.
- **Done when:** acceptance criteria 7–28 and 39–43 pass, including a forced timeout and a double-click.

### Phase 5 — Results, progression and match writeback

Goal: a match can be played to completion through the room.

- Independent per-map reports by both captains, with no visibility of the other report before submitting.
- Agreement advances to the next map without a ready check; disagreement freezes decision points until an admin resolves.
- Admin can report a result directly, including before captain reports exist.
- Progression: first-ban determination per map, rematch on draw, first-to-N versus fixed-N, and draws counting or not per format.
- Finish flow: final map history, room closed, match aggregate written once, no further decisions accepted.
- Cancel-vs-finish distinction in the UI and archive.
- **Done when:** acceptance criteria 29–33, 45 and 46 pass, and a completed room updates the match and the standings.

### Phase 6 — Configuration UI, hardening and documentation

Goal: operators can run the feature without SQL, and the edge cases hold up.

- Admin settings UI for scoped configuration with validation, an "effective configuration" preview and a warning when a child scope changes an inherited value.
- Map and gamemode administration, including activating/deactivating catalogue entries.
- Archive polish: filters by division, bracket and state; decision-log details; cancelled-room presentation.
- Hardening: per-room live-query subscriber limits, proxy buffering, service-worker cache exclusions, graceful shutdown of room channels and sweeper, logging of automatic decisions and sweeper failures.
- Full manual E2E across formats: group first map, bracket first map, draw, fixed pool, gamemode refresh, dispute, admin override, cancellation and deletion.
- Documentation: update `docs/live-pick-and-ban.md` to describe implemented behaviour, and add the new tables, live query and defaults to `docs/database.md` and `docs/api.md`.
- **Done when:** the full acceptance-criteria checklist passes on staging with seeded data.

## 7. Testing strategy

- **Pure rules:** unit tests for every transition and eligibility function, including boundary conditions (last gamemode used, role exhausted, no eligible map).
- **Time:** inject a clock into deadline functions; never rely on wall time in tests.
- **Manual:** a scripted E2E checklist per phase, run with two browser profiles and one guest, on mobile and desktop.

The repo has no database, scheduler or realtime test harness today. Integration tests for transactions, sweeper claims, concurrency, live-query transport and result writeback are intentionally out of scope for this plan; the test architecture for those will be designed in a separate pass. Until then, those paths are covered by the manual checklist, and the rule engine is kept pure so it does not depend on that work.

## 8. Risks and open questions

1. **Seed dependency is stale.** `initial-seeds` is not merged into the current branch nor `dev`. Phase 1 should start by merging/rebasing this branch onto it, not by duplicating the work done there.
2. **Map pool ownership.** The catalogue needs real map data and a policy for which maps are legal per season. Product input is required before Phase 1 can seed it.
3. **Redis optionality.** Presence falls back to memory when `REDIS_URL` is unset, which is correct only for a single instance. This must be documented and re-evaluated if topology changes.
4. **Clock source.** Use database `now()` for deadlines so the sweeper and live queries agree. Confirm the production database clock is authoritative enough for 60-second deadlines.
5. **Multiple captains.** Any captain may act; readiness is per team. Readiness survives as long as at least one captain is still connected.
6. **Fixed map pool format.** The requirements say "fixed per game" but not how the list is expressed. The config schema must define an ordered per-game map list.
7. **Live-query scale.** No hard viewer cap is specified. Add a per-room subscriber limit and a room-level viewer count in Phase 6, and confirm expected viewership.
8. **Archive retention.** Finished and cancelled rooms are retained indefinitely, which means decision logs and reports grow forever. This is acceptable at current scale but should be noted in the database docs.
9. **Live queries are state, not an event log.** SvelteKit keeps only the latest pending value per live query and may coalesce updates. Every yield must therefore be a complete room snapshot containing the decision log and map history; never rely on the client receiving every individual event.

## 9. Definition of done

- Every acceptance criterion in the requirements document is demonstrably met on staging.
- Pick and ban is opt-in per configuration and has no effect on matches without a room.
- All room actions are server-validated, idempotent and recorded with actor and timestamp.
- Room state survives reloads, reconnects and server restarts, and all viewers see changes within two seconds.
- The room is usable without logging in for viewing, and on mobile, keyboard and both themes for participation.
- User-facing copy is in Swedish; code, comments and docs are in English.
- `pnpm check`, `pnpm test` and `pnpm lint` pass, and the relevant docs are updated.
