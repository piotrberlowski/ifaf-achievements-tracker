-- A score is tombstoned in place. The standing record is the current holder only.
ALTER TABLE "score" ADD COLUMN "tombstoned" BOOLEAN NOT NULL DEFAULT false;

CREATE FUNCTION score_reject_change() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'score rows are append-only'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF OLD.tombstoned OR NOT NEW.tombstoned
      OR (to_jsonb(OLD) - 'tombstoned') IS DISTINCT FROM (to_jsonb(NEW) - 'tombstoned') THEN
    RAISE EXCEPTION 'score rows are append-only'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER score_append_only ON "score";

CREATE TRIGGER score_append_only
  BEFORE UPDATE OR DELETE ON "score"
  FOR EACH ROW EXECUTE FUNCTION score_reject_change();

CREATE TRIGGER score_tombstone_refresh_record_standing
  AFTER UPDATE OF "tombstoned" ON "score"
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_record_standing();

DROP MATERIALIZED VIEW "record_standing";

DROP TABLE "score_void";

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
    WHERE NOT s.tombstoned
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
