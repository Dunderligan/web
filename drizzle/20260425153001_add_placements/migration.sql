ALTER TABLE match ADD COLUMN round INTEGER;

--> recursively calculate the round for each match, starting from final matches (round 0)
WITH RECURSIVE match_rounds AS (
    --> base cases: final matches (those without a nextMatchId) with round 0
    SELECT 
        id, 
        next_match_id, 
        0 AS round
    FROM match
    WHERE 
        next_match_id IS NULL AND
        bracket_id IS NOT NULL

    UNION ALL

    --> recursive step: join our current set of matches with their previous matches, incrementing the round
    SELECT 
        match.id, 
        match.next_match_id,
        match_rounds.round + 1
    FROM match
    JOIN match_rounds ON match.next_match_id = match_rounds.id
)
--> update the original match table with the calculated rounds
UPDATE match
SET round = match_rounds.round
FROM match_rounds
WHERE match.id = match_rounds.id;
