# Live pick and ban

A new feature added to the Dunderligan website that facilitates map picks and hero bans before matches. Inspired by FACEIT's similar feature.

## Background

In many matches played in the league, the maps played are not predetermined. Instead, each team picks from a map pool for each game. The map pool can either be a number of available gamemodes or a tighter set of specific maps that can be chosen.

In addition, before every map, the teams are allowed to ban one hero that neither of the teams can use for that map.

Currently, this is handled informally by the team captains via Overwatch lobby chat. The picks and bans are then logged manually in the Discord server.

## Feature description

The live pick and ban feature intents to formalize and ease the process of picking maps and banning heroes. Instead of handling the procedure themselves, teams will have the choice of making their choises via the website. This is optional; teams may agree to pick and ban manually if they prefer.

When pick and ban is done with the site, the results should be logged in the database automatically and linked to the match result. Manual picks do not need to be recorded on the site and can remain manually reported in the Discord server.

Bans abide the following rules:

- Before the first map, the team with the lower seed begins banning. In the group stage, this is based on the roster's initial seed. In the bracket stage, it's based on the results from the group stage.
- Following the first map, the loser of the previous map gets the first ban. In case of a drawn map, the previous first picker keeps their first pick.
- A team can ban any hero that they haven't banned on a previous map (banning a hero the enemy team has previously banned is permitted). If they go second, they cannot ban a hero from the same role as the first team did.
- The team first to ban may choose to let the other team go before.
- A team may not choose to skip their ban.

Map picks abide these rules:

- The same team that is designated first-ban team picks the map; that is, the team that would ban first if it does not concede. If it concedes the first ban, the map pick still stays with it, so the pick and the ban order may diverge.
- Contrary to hero bans, a team may not choose to concede the pick to the other team.
- The map pool may be constrained in these ways:
  - Only a subset of maps may be allowed.
  - The gamemodes may be constrained to a smaller set.
  - Gamemodes previously picked in the match may be disallowed. Here, the first game may have a fixed gamemode. If a match goes long enough that all gamemodes are used, they are refreshed and all gamemodes become available again.
- In some cases, the map pool is fixed per game in a match. In this case, no map selection should be offered.

These rules vary by bracket, group match round and division. A group match's round is its `round` number, which selects the applicable configuration.

During a game, members of the teams can connect to a live room on the site. Anyone can view the state of a room, even if not authenticated, however only team captains can make decisions The connection state of the players are shown in the interface.

While the room is open, both team captains must confirm that their team is ready. The room starts only when both teams are ready; one team's confirmation never starts it on its own, and there is no ready-check timeout. Readiness is tied to presence: if no captain of a team stays connected, that team is no longer considered ready. As soon as both teams are ready, the room moves directly to the pick and ban phase.

Once the captains of both teams have confirmed their teams are ready, the pick and ban process begins. At each decision point, a timeout is set. Once the timer runs out, a fallback decision is automatically taken for the timed-out team.

After all the decisions for a map are completed, the site displays the final choices and the teams are free to play the map. Upon returning, the captains report the result of the game independently. In case they agree, the next round proceeds. If they report differently, the room is frozen until an admin resolves the score. Additionally, an admin can report the result directly, before input from the captains are recorded. Repeat until the win condition of the match is achieved and the room is closed.

Matches are either first to N map wins or a fixed number N of maps; in a first-to-N match a draw does not count toward either team's wins, while in a fixed-N match a draw counts as one of the N maps.

Rooms are automatically created ahead of time by the site for applicable planned matches, no later than 15 minutes before the scheduled start. Admins are also able to manually create a room for a chosen match. If the room goes inactive for some time after the match is set to start (the teams chose to do it manually, or the match was cancelled), it is silently deleted. Finished and cancelled rooms are retained in an archive list indefinitely, like other match results.

## Configuration defaults

Configuration is stored in scoped rows that vary by division, bracket and match round. Every rule knob can be left unset (`null`) on a row, in which case it inherits the value from the next-less-specific applicable scope. When no scope sets a value, these defaults apply:

| Setting                         | Default                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| Pick and ban enabled            | No                                                              |
| Win condition                   | First to 3 map wins                                             |
| Map pool                        | All active maps                                                 |
| Gamemode pool                   | All active gamemodes                                            |
| Restrict used gamemodes         | No                                                              |
| Fixed gamemode on the first map | No                                                              |
| Fixed map pool per game         | No                                                              |
| Decision timeout                | 60 seconds                                                      |
| Concede the first ban           | Allowed                                                         |
| Timeout fallbacks               | Do not concede; randomly pick/ban among eligible options        |
| Room creation lead time         | 15 minutes before scheduled start                               |
| Inactive room deletion          | 60 minutes after scheduled start if readiness was not completed |

Scope precedence, most specific first: division + bracket + round, bracket + round, division + bracket, bracket, division + round, division, round, global. A scope applies only when each of its non-null dimensions matches the match. Group matches currently have no round number, so round-scoped rows only apply to bracket matches.

Any settings that cannot form a coherent configuration (for example an empty restricted map or gamemode pool, a fixed map pool with duplicate maps, or a fixed first gamemode without a gamemode) are rejected when the effective configuration is resolved.
