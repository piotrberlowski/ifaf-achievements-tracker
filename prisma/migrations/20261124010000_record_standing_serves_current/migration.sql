-- The view already keeps every score that set a record. Mark the current
-- holder there, and include the names the records page shows.
DROP MATERIALIZED VIEW "record_standing";

CREATE MATERIALIZED VIEW "record_standing" AS
WITH setter AS (
    SELECT
        s.id AS "scoreId",
        c."roundId" AS "roundId",
        round.code AS "roundCode",
        round.name AS "roundName",
        round."displayOnly" AS "displayOnly",
        track.code AS "awardTrackCode",
        s."bowStyleId" AS "bowStyleId",
        style.code AS "bowCode",
        s."ageDivisionId" AS "ageDivisionId",
        age.code AS "ageCode",
        s.gender AS gender,
        s."personId" AS "personId",
        s.score AS score,
        c."startsOn" AS "effectiveOn",
        s."createdAt"::date AS "recognisedOn",
        s."createdAt" AS "recognisedAt",
        c.name AS "eventName",
        COALESCE(
            (
                SELECT name."fullName"
                FROM "person_name" name
                WHERE name."personId" = s."personId"
                    AND name."approvedAt" IS NOT NULL
                ORDER BY name."approvedAt" DESC, name."createdAt" DESC
                LIMIT 1
            ),
            (
                SELECT name."fullName"
                FROM "person_name" name
                WHERE name."personId" = s."personId"
                ORDER BY name."createdAt" DESC
                LIMIT 1
            ),
            'Unknown archer'
        ) AS holder
    FROM "score" s
    JOIN "competition" c ON c.id = s."competitionId"
    JOIN "round" round ON round.id = c."roundId"
    JOIN "award_track" track ON track.id = round."awardTrackId"
    JOIN "bow_style" style ON style.id = s."bowStyleId"
    JOIN "age_division" age ON age.id = s."ageDivisionId"
    LEFT JOIN "score_void" voided ON voided."scoreId" = s.id
    WHERE voided.id IS NULL
        AND NOT EXISTS (
            SELECT 1
            FROM "score" earlier
            JOIN "competition" earlier_competition
                ON earlier_competition.id = earlier."competitionId"
            LEFT JOIN "score_void" earlier_void
                ON earlier_void."scoreId" = earlier.id
            WHERE earlier_void.id IS NULL
                AND earlier.id <> s.id
                AND earlier."bowStyleId" = s."bowStyleId"
                AND earlier."ageDivisionId" = s."ageDivisionId"
                AND earlier.gender = s.gender
                AND earlier_competition."roundId" = c."roundId"
                AND earlier.score >= s.score
                AND (
                    earlier_competition."startsOn" < c."startsOn"
                    OR (
                        earlier_competition."startsOn" IS NOT DISTINCT FROM c."startsOn"
                        AND (
                            earlier."createdAt" < s."createdAt"
                            OR (
                                earlier."createdAt" = s."createdAt"
                                AND earlier.id < s.id
                            )
                        )
                    )
                    OR (
                        earlier_competition."startsOn" IS NOT NULL
                        AND c."startsOn" IS NULL
                    )
                )
        )
)
SELECT
    setter."scoreId",
    setter."roundId",
    setter."roundCode",
    setter."roundName",
    setter."displayOnly",
    setter."awardTrackCode",
    setter."bowStyleId",
    setter."bowCode",
    setter."ageDivisionId",
    setter."ageCode",
    setter.gender,
    setter."personId",
    setter.score,
    setter."effectiveOn",
    setter."recognisedOn",
    setter."eventName",
    setter.holder,
    row_number() OVER (
        PARTITION BY setter."roundId", setter."bowStyleId", setter."ageDivisionId", setter.gender
        ORDER BY
            setter.score DESC,
            setter."effectiveOn" ASC NULLS LAST,
            setter."recognisedAt" ASC,
            setter."scoreId" ASC
    ) = 1 AS current
FROM setter;

CREATE UNIQUE INDEX "record_standing_scoreId_key" ON "record_standing" ("scoreId");

CREATE INDEX "record_standing_current_idx"
    ON "record_standing" ("awardTrackCode", "bowCode", "ageCode", gender)
    WHERE current;
