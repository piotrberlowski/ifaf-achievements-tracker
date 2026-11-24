-- One current holder per class. Voided scores are not records.
DROP MATERIALIZED VIEW "record_standing";

CREATE MATERIALIZED VIEW "record_standing" AS
WITH holder AS (
    SELECT DISTINCT ON (
        c."roundId",
        s."bowStyleId",
        s."ageDivisionId",
        s.gender
    )
        s.id AS "scoreId",
        c."roundId" AS "roundId",
        s."bowStyleId" AS "bowStyleId",
        s."ageDivisionId" AS "ageDivisionId",
        s.gender AS gender,
        s."personId" AS "personId",
        s.score AS score,
        c."startsOn" AS "effectiveOn",
        s."createdAt"::date AS "recognisedOn",
        c.name AS "eventName"
    FROM "score" s
    JOIN "competition" c ON c.id = s."competitionId"
    LEFT JOIN "score_void" voided ON voided."scoreId" = s.id
    WHERE voided.id IS NULL
        AND c."roundId" IS NOT NULL
    ORDER BY
        c."roundId",
        s."bowStyleId",
        s."ageDivisionId",
        s.gender,
        s.score DESC,
        c."startsOn" ASC NULLS LAST,
        s."createdAt" ASC,
        s.id ASC
)
SELECT
    holder."scoreId",
    holder."roundId",
    round.code AS "roundCode",
    round.name AS "roundName",
    round."displayOnly" AS "displayOnly",
    track.code AS "awardTrackCode",
    holder."bowStyleId",
    style.code AS "bowCode",
    holder."ageDivisionId",
    age.code AS "ageCode",
    holder.gender,
    holder."personId",
    holder.score,
    holder."effectiveOn",
    holder."recognisedOn",
    holder."eventName",
    COALESCE(name."fullName", 'Unknown archer') AS holder
FROM holder
JOIN "round" round ON round.id = holder."roundId"
JOIN "award_track" track ON track.id = round."awardTrackId"
JOIN "bow_style" style ON style.id = holder."bowStyleId"
JOIN "age_division" age ON age.id = holder."ageDivisionId"
LEFT JOIN LATERAL (
    SELECT person_name."fullName"
    FROM "person_name" person_name
    WHERE person_name."personId" = holder."personId"
    ORDER BY person_name."approvedAt" DESC NULLS LAST, person_name."createdAt" DESC
    LIMIT 1
) name ON true;

CREATE UNIQUE INDEX "record_standing_scoreId_key" ON "record_standing" ("scoreId");

CREATE INDEX "record_standing_lookup_idx"
    ON "record_standing" ("awardTrackCode", "bowCode", "ageCode", gender);
