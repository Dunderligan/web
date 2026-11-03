# Live pick and ban — Requirements

Status: draft for review
Scope: product requirements for the live pick and ban feature. Data model, API and realtime transport design are explicitly out of scope.

## 1. Purpose

Dunderligan matches are played on a set of maps, and each map is preceded by one hero ban per team. Today team captains agree on picks and bans in Overwatch lobby chat and then log the outcome manually in Discord. This is error-prone, slow, and produces no link between the decisions and the recorded match result.

The live pick and ban feature formalizes the process: teams meet in a room on the site, make their decisions in a defined order with server-enforced rules and timeouts, and the outcome is recorded automatically against the match.

### In scope

- A room per applicable match, where two teams pick maps and ban heroes.
- Server-enforced decision order, eligibility rules, and timeouts with fallbacks.
- Presence and ready check for the two participating teams.
- Independent per-map result reporting by both captains, with agreement-based progression.
- Automatic persistence of every decision, linked to the match.
- Read-only access to any room for anyone, including unauthenticated visitors.
- Admin ability to create, cancel and resolve rooms.
- Per-division, per-bracket and per-group-round configuration of the rules.

### Out of scope

- Enforcing bans or map choices inside the game client.
- Generating tournament formats, brackets or schedules.
- A manual path for entering picks and bans made outside the site. Teams that pick and ban manually continue reporting in Discord.
- Changing how teams currently agree on _when_ to play or how they report the final match score, except where a room's recorded results feed that score.
- Notifications outside the room (Discord, email, push).
- Calculating initial seeds; initial seeds are provided as roster data and this feature only consumes them.

## 2. Terminology

| Term           | Meaning                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| Room           | The live session for one match, holding all maps, decisions and reports.               |
| Map / game     | One game within the match. Both terms are used interchangeably.                        |
| Decision point | A single required action by one team (ban order, ban, map pick, ready, result report). |
| First-ban team | The team that picks the map and holds the right to ban first on the current map.       |
| Role           | Hero role as defined in the hero catalogue: tank, damage or support.                   |
| Map pool       | The set of maps and/or gamemodes a match may draw from.                                |
| Seed           | Placement used for ordering teams. Seed 1 is the strongest team.                       |
| Initial seed   | The roster's pre-season seed, used to determine first ban in group matches.            |
| Group round    | The round number of a group match, stored in the match's `round` column.               |
| Fixed pool     | A map pool where the map is predetermined per game, so no map pick is offered.         |

"Lower seed" means the worse placement, i.e. the higher seed number.

## 3. Actors and permissions

| Actor                   | Permissions                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest (unauthenticated) | View any room, including live state and final results. Cannot join presence, ready up, decide or report.                                       |
| Team member             | Join the room presence for their own roster while signed in. Cannot decide or report.                                                          |
| Captain                 | Everything a team member can do, plus concede the first ban, ban, pick, ready up and report results for their own team.                        |     |
| Admin                   | Create a room for a chosen match, cancel a room, resolve disputed results, and override a stuck decision point. No participation in decisions. |

There is no concept of home or away team in the tournament; teams are referred to as the teams in slots A and B.

If a roster has several captains, any one of them may act for that team. A decision is final once made; a second captain cannot overwrite it.

## 4. Eligibility and configuration

### 4.1 When a match is eligible

A match is eligible for the feature when all of the following hold:

- Both roster slots are filled.
- The match is in the scheduled state, or has begun but has no recorded room result.
- Pick and ban is enabled by the applicable configuration.

### 4.2 Configuration dimensions

Rules vary by division, by bracket, and by group match round. For group matches, the round is the match's `round` value, and that number selects the applicable configuration. The following is configurable and may differ between these dimensions:

- Whether pick and ban is used at all for the match.
- Win condition: either first to a number N of map wins, or a fixed number N of maps played.
- Map pool: a subset of maps that are allowed (optional).
- Whether previously picked game modes should be restricted.
- Whether the first map has a fixed gamemode.
- Whether the map is fixed per game, in which case no map pick is offered and only bans take place.
- Decision timeout length.
- Whether the first-ban team may concede the first ban.

Configuration must be resolvable for any eligible match at room creation time. Where a dimension has no specific configuration, the closest parent configuration applies, ending in a documented default. The order of decision points is fixed and is not configurable (see §6.6).

### 4.3 Defaults

When configuration leaves a choice open:

- Decision timeout: a single documented default, applied uniformly.
- Automatic ban: a uniformly random hero among the heroes that team may ban on that map.
- Automatic map pick: a uniformly random map among the maps eligible under the map pool for that map.

The random choice is made once on the server and recorded like any other decision, so every client sees the same outcome.

## 5. Room lifecycle

1. **Planned.** Rooms are created automatically ahead of time for eligible matches that have a scheduled start time, no later than 15 minutes before that time. The lead time may be longer, but never shorter than 15 minutes.
2. **Open.** Participants may join. The room accepts presence and a ready check, but no decisions are made yet.
3. **Ready check.** Each captain confirms their team is ready. Both teams must be ready before the room proceeds; the room never starts with only one team ready. Both confirmations are active simultaneously, and a captain may withdraw readiness until the first decision is made. There is no automatic ready-check timeout: the room stays in this state until both teams are ready or an admin cancels it.
4. **In progress.** Decisions are made map by map. The room shows the current decision point, which team may act, and how long is left.
5. **Map complete.** The decisions for the current map are shown as final, and the teams play the map outside the site.
6. **Map reported.** Both captains report the result. Agreement advances to the next map; disagreement pauses the room.
7. **Finished.** The win condition is met (a team reaches N map wins, or all N maps of a fixed-map match have been played). The room closes and the match result is updated from the recorded maps.
8. **Deleted.** A room with no activity after the match start time plus a grace period is silently and permanently removed (teams chose manual play, or the match was cancelled). Deletion leaves no user-facing trace other than the room no longer being available.

Admins may create a room for a chosen match at any time, and may cancel a room at any point. A cancelled room is closed and its partial decisions are retained for traceability but are no longer live.

At most one active room exists per match.

## 6. Decision rules

### 6.1 Determining the first-ban team

| Situation                    | First-ban team                                             |
| ---------------------------- | ---------------------------------------------------------- |
| First map of a group match   | The team with the lower initial seed.                      |
| First map of a bracket match | The team with the lower seed based on group-stage results. |
| Any later map                | The loser of the previous map.                             |
| Previous map was a draw      | The same team that held first ban on the drawn map.        |

### 6.2 Conceding the first ban

- The first-ban team always picks the map. The map pick can never be conceded, and it stays with the original first-ban team even when that team concedes the first ban and therefore bans second. The pick and the ban order may thus diverge.
- The first-ban team may concede the first hero ban, letting the other team ban first. The conceding team then bans second on that map; the map pick is unaffected.
- Only the first-ban team may concede, and only the ban order. The other team may neither refuse nor hand the ban order back.
- The concession is a decision point after the map pick and before the first ban, with its own timeout. If the timer expires, the first-ban team bans first.

### 6.3 Map picks

- The first-ban team picks the map for that map, unless the pool is fixed. The pick stays with the first-ban team even if it concedes the first hero ban.
- The pick belongs to the first-ban team and cannot be conceded or transferred.
- The picked map must be eligible under the configured map pool and must not have been picked earlier in the match, unless the gamemode pool has been exhausted and refreshed.
- When the map pool is fixed per game, no pick is offered, and the map for that game is displayed as predetermined.
- The team may not skip the pick.

### 6.4 Hero bans

- Each team bans exactly one hero per map. A team may not skip its ban.
- The first-ban team bans first, unless it has conceded the first ban to the other team. The team banning second sees the first ban before acting.
- A team may not ban a hero that the same team banned on any earlier map in the match.
- A team may ban a hero that the opposing team banned on an earlier map.
- The second ban must be a different hero role from the first ban on the same map.
- Both bans apply to that map only and do not carry over to later maps.

### 6.5 Gamemode and map pool refresh

- If the match rules are configured for it, gamemodes already picked earlier in the match are unavailable.
- If a match goes long enough that every gamemode in the pool has been used, the gamemode pool refreshes and all gamemodes become available again. Previously played maps remain visible in the match history.
- Map-level restrictions continue to apply after a refresh.

### 6.6 Per-map decision order

For each map, decisions happen in this order:

1. Map pick by the first-ban team, or automatic assignment when the pool is fixed. The pick cannot be conceded.
2. Ban order decision by the same team: ban first, or concede the first ban to the other team.
3. First hero ban.
4. Second hero ban, restricted to a different role.
5. Result reporting, after the map has been played.

All decisions are sequential; no two decision points are open at once. This order is fixed for every division and cannot be reconfigured.

## 7. Timeouts and fallbacks

- Every decision point has a server-side deadline derived from the configured timeout. Deadlines are authoritative on the server; a client clock or reload must not change them.
- When a deadline passes, the site takes the fallback decision automatically on behalf of the timed-out team and records it as automatic.
- Fallbacks:
  - Ban order: the first-ban team bans first.
  - Map pick: a random eligible map is picked automatically.
  - Hero ban: a random eligible hero, respecting the team's own ban history and the role restriction, is banned automatically.
  - Result report: no automatic result is ever produced. Instead, the room pauses and requires admin resolution.
- An automatic decision is relayed to all connected clients and displayed as automatic in the decision log.
- A decision submitted by a captain at the moment the timer expires is accepted if it reaches the server before the fallback is applied; otherwise the fallback stands. Exactly one decision is recorded per decision point.

## 8. Result reporting

- After a map's decisions are complete, the map is displayed as final with its map, bans, and which team was the first-ban team.
- Captains report the map result independently: the winner (one of the two teams) or a draw, plus the map score where the format records one.
- Draws are recorded in both win-condition formats. In a first-to-N match, a draw does not count toward either team's map wins, so the match continues. In a fixed-N match, a draw counts as one of the N maps played.
- Neither captain sees the other's report before submitting their own.
- When both reports agree, the result is recorded against the match and the room advances to the next map, or closes if the win condition is now met. No new ready check is required, and the next map starts at its map pick decision point.
- When the reports disagree, the room pauses, both reports are shown to the captains and to admins, and no further decision points open until an admin resolves the map result. After admin resolution, the room resumes.
- An admin can always set the map result directly, even before the captains have submitted a result.
- When the win condition is met the room shows the final result, closes, and no further decisions are accepted.
- Results recorded in the room are automatically submitted to the match after it's completed.

## 9. Presence

- Signed-in members of the two participating rosters may join the room's presence; membership is determined by the roster's member list.
- Guests and signed-in users who are not members may view the room state but do not appear in presence.
- The room displays the connection state of each participating team and which of its players are connected.
- A participant leaving or losing connection is shown as disconnected; the room state and pending deadlines continue unaffected.
- Captains who disconnect may reconnect and resume; their pending decisions are subject to the same deadlines.
- Ready state is withdrawn if the captain disconnects.
- Presence data is ephemeral and is discarded when the room closes or is deleted.

## 10. Logging and auditability

- Every decision is recorded with its decision point, acting team, acting captain (or automatic), the chosen value, and a timestamp.
- Decisions are append-only; they cannot be edited through the UI.
- The full decision log of a finished room is available from the archived room page.
- Finished rooms, cancelled rooms and their decision logs are retained indefinitely, like other match results. Only auto-deleted rooms, which have no activity, leave no trace.
- Admin actions (creation, cancellation, resolution, override) are recorded with the acting admin.

## 11. Non-functional requirements

- **Concurrency:** two decisions for the same decision point cannot both be recorded. Duplicate submissions, double clicks and retries are idempotent.
- **Timeliness:** a decision or state transition becomes visible to all connected clients within two seconds under 99% of cases.
- **Resilience:** reloading or losing the connection does not lose state; clients reconstruct the room from the server.
- **Availability of viewing:** an unauthenticated visitor can load a room page and see the current state without any account.
- **Accessibility:** all interactive elements are keyboard reachable with visible focus, and state is not conveyed by colour alone.
- **Localization:** all user-facing text is in Swedish, following site conventions.
- **Platforms:** the room works on mobile and desktop, in light and dark theme.
- **Load:** the room page and its updates must not be allowed to degrade the site for other visitors.

## 12. Acceptance criteria

### Eligibility and lifecycle

1. When an eligible match with a scheduled start time is at most 15 minutes away, a room exists for it that is listed in the room list page.
2. A match with pick and ban disabled has no room and shows no pick and ban entry point.
3. An admin can create a room for a chosen eligible match, and it behaves like an automatically created room.
4. An admin can cancel a room, after which no decisions are accepted and viewing shows the room as cancelled.
5. A room with no activity after the configured grace period past the match start time is removed and produces no error for anyone who follows a previously known link.
6. Only one active room can exist per match.

### First-ban determination

7. In a group match, the team with the worse initial seed (the roster's initial seed) is the first-ban team on the first map.
8. In a bracket match, the first-ban team on the first map is the team with the worse group-stage placement.
9. If the previous map had a winner, the loser is the first-ban team on the next map.
10. If the previous map was a draw, the team that was first-ban team on that map is again.
11. The decision order is always map pick, ban order, first ban, second ban; no configuration can reorder it.

### Conceding the first ban

12. The first-ban team picks the map, and the pick cannot be conceded or claimed by the other team.
13. The first-ban team can concede the first hero ban, after which it bans second on that map while keeping the map pick.
14. The team that is not the first-ban team cannot concede, cannot claim the pick, and cannot hand the ban order back.
15. If the ban order decision times out, the first-ban team bans first.

### Map picks

16. The first-ban team picks the map, and the pick is recorded in the decision log.
17. A map outside the configured pool cannot be picked.
18. A map or gamemode already used in the match cannot be picked, except a gamemode after a pool refresh (maps can never be repicked).
19. A team cannot skip its pick; on timeout a random eligible map is picked automatically.
20. With a fixed map pool per game, no pick decision point appears and the predetermined map is shown.
21. When all gamemodes have been used, the pool refreshes and every gamemode becomes available again.
22. When the first map has a fixed gamemode, the first pick is constrained to maps within that gamemode.

### Hero bans

23. Each team bans exactly one hero per map, in turn order, and the second banner sees the first ban before choosing.
24. A team cannot ban a hero it banned on an earlier map in the same match.
25. A team can ban a hero the opposing team banned on an earlier map.
26. The second ban must be a different hero role from the first ban on the same map, and violating choices are rejected by the server, not only the client.
27. A team cannot skip its ban; on timeout a random eligible hero is banned automatically.
28. Bans apply only to their own map and are shown alongside that map's result.

### Results and progression

29. Both captains must report each map result independently, and neither sees the other's report beforehand.
30. Agreeing reports advance the room to the next map without another ready check.
31. Disagreeing reports pause the room, and no decision point can open until an admin resolves the result.
32. The room closes when the win condition is met, and the room's page shows the map history and bans.
33. Automatic results are never produced for an unreported map.

### Presence and permissions

34. A signed-in member of a participating roster joins presence and is shown as connected.
35. A signed-in user who is not a roster member can view the room but does not appear in presence.
36. An unauthenticated visitor can view the room and its live state.
37. A non-captain cannot make a decision, ready up or report a result; a captain can only act for their own team.
38. A captain disconnecting is shown as disconnected, withdraws readiness, and can reconnect without losing room state.
39. Once a captain acts on a decision point, neither that captain nor another captain of the same team can change it.

### Timeouts and logging

40. Each decision point shows the remaining time from a server-authoritative deadline, and reloading the page does not reset it.
41. When a deadline passes, exactly one automatic decision is recorded, chosen at random among the eligible options, and shown as automatic to all clients.
42. A captain submission that arrives before the fallback is applied is recorded; one that arrives after is rejected.
43. Every decision, including automatic and admin actions, is present in the room's decision log with actor and timestamp.
44. A room does not leave the ready check until both captains have readied their teams; it does not start automatically with only one team ready.
45. In a first-to-N match, draws are recorded but do not count toward either team's map wins; in a fixed-N match, a draw counts as one of the N maps played.
46. A first-to-N match closes when a team reaches N map wins; a fixed-N match closes after exactly N maps have been played.
47. Every viewer, including an unauthenticated visitor, sees each pick and ban decision as soon as it is recorded, with no delay until the map is final.
48. Finished and cancelled rooms remain available indefinitely with their decision logs; only auto-deleted rooms leave no trace.
