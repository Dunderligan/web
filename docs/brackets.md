# Brackets

Brackets are represented in the database by the `bracket` table. Each bracket is linked to a division with a name, slug and format. A division may contain multiple brackets. For example, in [season 5](https://dunderligan.se/stallningar/sasong-5?div=1&visa=slutspel), the divisions were split into two brackets, for the top and bottom teams respectively.

## Format

Brackets can be either single or double elimination.

Single elimination is the classic bracket structure; each round contains half the number of matches as the previous one, and the winner advances to the next round at each stage.

Double elimination adds a lower bracket where losers end up after losing their first game in the upper bracket. After a team loses two matches, they are eliminated. The final winners of the lower and upper brackets meet in the grand final. The concept of "bracket reset", where the lower bracket winner must win twice gainst the upper bracket winner, is not implemented in the current version of the system.

## Structure

The structure of a bracket is built by standard `match` objects, linked to the bracket by the `bracketId` field. The fields `nextMatchId` and `loserNextMatchId` are used to link the matches together in a tree, where `nextMatchId` points to the next match for the winner of the current match, and `loserNextMatchId` for the loser. In single elimination brackets, the `loserNextMatchId` field is always null.

The structure is not editable by admins. Instead, it's generated once by the functions in the `src/lib/bracket/index.ts` file and stored immutably in the database.

## Rendering

Brackets are rendered by the `Bracket` component. It computes the layout mathematically and lays the matches out using absolute positioning. The positioning logic is contained in `src/lib/bracket/layout.ts`. Lines between rounds ("match edges") are also computed with the same function, and rendered with SVG `<path>`s.

## Placement

A roster's placement in a bracket is displayed on the roster page and the players' profile pages. Placement is currently determined by looking at the furthest in the bracket that the roster reached, and computing how many teams remained at that round. This logic is contained inside `src/lib/match.ts`.

This method gives slightly inaccurate results for double elimination brackets and may overshoot for single elimination brackets (in case the first round wasn't filled). The placement is capped at the number of teams in the division to compensate. A better algorithm to determine placement may be implemented in the future.

## Byes

In case a bracket is not filled, the system automatically generates byes for the first round. A bye is where one team is automatically advanced to the next round without playing a match. In the system, byes are represented by `match` objects with a `null` roster in one of the slots, `MatchState.WALKOVER` as the match state, and a `3-0` score assigned to the team.

Byes still affect the bracket layout, but are not rendered.
