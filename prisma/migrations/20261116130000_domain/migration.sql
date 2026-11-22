-- CreateEnum
CREATE TYPE "division_gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "submission_source" AS ENUM ('api', 'csv', 'xlsx', 'import');

-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "award_level" AS ENUM ('bronze', 'silver', 'gold', 'hotshot', 'star');

-- CreateEnum
CREATE TYPE "pin_status" AS ENUM ('pending', 'issued');

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_name" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "note" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_name_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bow_style" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "bow_style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_division" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "division_gender" NOT NULL,

    CONSTRAINT "age_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shooting_class" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bowStyleId" TEXT NOT NULL,
    "ageDivisionId" TEXT NOT NULL,

    CONSTRAINT "shooting_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_track" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "award_track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "awardTrackId" TEXT NOT NULL,
    "displayOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "certificateFingerprint" TEXT,
    "secretHash" TEXT,
    "issuedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "integration_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE,
    "roundCode" TEXT NOT NULL,
    "roundId" TEXT,
    "countsForGains" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_submission" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'pending',
    "source" "submission_source" NOT NULL,
    "externalId" TEXT,
    "integrationClientId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_entry" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "archerName" TEXT NOT NULL,
    "club" TEXT,
    "classCode" TEXT NOT NULL,
    "shootingClassId" TEXT,
    "score" INTEGER,
    "scoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "shootingClassId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_void" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "replacementScoreId" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedById" TEXT NOT NULL,

    CONSTRAINT "score_void_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gains_award" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "shootingClassId" TEXT NOT NULL,
    "awardTrackId" TEXT NOT NULL,
    "level" "award_level" NOT NULL,
    "status" "pin_status" NOT NULL DEFAULT 'pending',
    "issuedOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gains_award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_claim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "personId" TEXT,
    "status" "claim_status" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_membershipNumber_key" ON "person"("membershipNumber");

-- CreateIndex
CREATE INDEX "person_name_personId_approvedAt_idx" ON "person_name"("personId", "approvedAt");

-- CreateIndex
CREATE INDEX "person_name_fullName_idx" ON "person_name"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "bow_style_code_key" ON "bow_style"("code");

-- CreateIndex
CREATE UNIQUE INDEX "age_division_code_key" ON "age_division"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shooting_class_code_key" ON "shooting_class"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shooting_class_bowStyleId_ageDivisionId_key" ON "shooting_class"("bowStyleId", "ageDivisionId");

-- CreateIndex
CREATE UNIQUE INDEX "award_track_code_key" ON "award_track"("code");

-- CreateIndex
CREATE UNIQUE INDEX "round_code_key" ON "round"("code");

-- CreateIndex
CREATE UNIQUE INDEX "integration_client_certificateFingerprint_key" ON "integration_client"("certificateFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "score_submission_competitionId_key" ON "score_submission"("competitionId");

-- CreateIndex
CREATE INDEX "score_submission_status_idx" ON "score_submission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "score_submission_integrationClientId_externalId_key" ON "score_submission"("integrationClientId", "externalId");

-- CreateIndex
CREATE INDEX "submission_entry_submissionId_idx" ON "submission_entry"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_entry_scoreId_key" ON "submission_entry"("scoreId");

-- CreateIndex
CREATE INDEX "score_personId_shootingClassId_idx" ON "score"("personId", "shootingClassId");

-- CreateIndex
CREATE INDEX "score_competitionId_idx" ON "score"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "score_void_scoreId_key" ON "score_void"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "score_void_replacementScoreId_key" ON "score_void"("replacementScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "gains_award_personId_shootingClassId_awardTrackId_level_key" ON "gains_award"("personId", "shootingClassId", "awardTrackId", "level");

-- CreateIndex
CREATE INDEX "membership_claim_userId_status_idx" ON "membership_claim"("userId", "status");

-- CreateIndex
CREATE INDEX "membership_claim_membershipNumber_idx" ON "membership_claim"("membershipNumber");

-- AddForeignKey
ALTER TABLE "person_name" ADD CONSTRAINT "person_name_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_name" ADD CONSTRAINT "person_name_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_class" ADD CONSTRAINT "shooting_class_bowStyleId_fkey" FOREIGN KEY ("bowStyleId") REFERENCES "bow_style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_class" ADD CONSTRAINT "shooting_class_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_awardTrackId_fkey" FOREIGN KEY ("awardTrackId") REFERENCES "award_track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_client" ADD CONSTRAINT "integration_client_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_submission" ADD CONSTRAINT "score_submission_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_submission" ADD CONSTRAINT "score_submission_integrationClientId_fkey" FOREIGN KEY ("integrationClientId") REFERENCES "integration_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_submission" ADD CONSTRAINT "score_submission_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_submission" ADD CONSTRAINT "score_submission_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "score_submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_shootingClassId_fkey" FOREIGN KEY ("shootingClassId") REFERENCES "shooting_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_shootingClassId_fkey" FOREIGN KEY ("shootingClassId") REFERENCES "shooting_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_void" ADD CONSTRAINT "score_void_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_void" ADD CONSTRAINT "score_void_replacementScoreId_fkey" FOREIGN KEY ("replacementScoreId") REFERENCES "score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_void" ADD CONSTRAINT "score_void_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gains_award" ADD CONSTRAINT "gains_award_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gains_award" ADD CONSTRAINT "gains_award_shootingClassId_fkey" FOREIGN KEY ("shootingClassId") REFERENCES "shooting_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gains_award" ADD CONSTRAINT "gains_award_awardTrackId_fkey" FOREIGN KEY ("awardTrackId") REFERENCES "award_track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_claim" ADD CONSTRAINT "membership_claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_claim" ADD CONSTRAINT "membership_claim_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_claim" ADD CONSTRAINT "membership_claim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Scores and voids are insert-only. A submission can be edited while it is
-- pending. Approving or rejecting it is the last change. Standing records
-- and standing awards are views over the scores.

ALTER TABLE "score" ADD CONSTRAINT "score_value_nonnegative" CHECK ("score" >= 0);

ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_score_nonnegative" CHECK ("score" IS NULL OR "score" >= 0);

ALTER TABLE "score_void" ADD CONSTRAINT "score_void_distinct_scores" CHECK ("scoreId" <> "replacementScoreId");

ALTER TABLE "score_submission" ADD CONSTRAINT "score_submission_status_shape" CHECK (
    (
        "status" = 'pending'
        AND "approvedAt" IS NULL
        AND "approvedById" IS NULL
        AND "rejectedAt" IS NULL
        AND "rejectedById" IS NULL
    )
    OR (
        "status" = 'approved'
        AND "approvedAt" IS NOT NULL
        AND "approvedById" IS NOT NULL
        AND "rejectedAt" IS NULL
        AND "rejectedById" IS NULL
    )
    OR (
        "status" = 'rejected'
        AND "rejectedAt" IS NOT NULL
        AND "rejectedById" IS NOT NULL
        AND "approvedAt" IS NULL
        AND "approvedById" IS NULL
    )
);

CREATE FUNCTION domain_reject_change() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only', TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER score_append_only
  BEFORE UPDATE OR DELETE ON "score"
  FOR EACH ROW EXECUTE FUNCTION domain_reject_change();

CREATE TRIGGER score_void_append_only
  BEFORE UPDATE OR DELETE ON "score_void"
  FOR EACH ROW EXECUTE FUNCTION domain_reject_change();

CREATE FUNCTION score_submission_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'score_submission rows are append-only'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF OLD.status::text <> 'pending' THEN
    RAISE EXCEPTION 'score_submission rows are append-only once decided'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER score_submission_append_only
  BEFORE UPDATE OR DELETE ON "score_submission"
  FOR EACH ROW EXECUTE FUNCTION score_submission_guard();

CREATE FUNCTION submission_entry_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_status text;
BEGIN
  SELECT status::text INTO parent_status
  FROM "score_submission"
  WHERE id = COALESCE(OLD."submissionId", NEW."submissionId");

  IF parent_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'submission_entry rows are append-only once the submission is decided'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER submission_entry_follows_submission
  BEFORE INSERT OR UPDATE OR DELETE ON "submission_entry"
  FOR EACH ROW EXECUTE FUNCTION submission_entry_guard();

CREATE FUNCTION competition_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "score_submission"
    WHERE "competitionId" = OLD.id
      AND status::text <> 'pending'
  ) THEN
    RAISE EXCEPTION 'competition rows are append-only once the submission is decided'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER competition_follows_submission
  BEFORE UPDATE OR DELETE ON "competition"
  FOR EACH ROW EXECUTE FUNCTION competition_guard();

-- A score sets the record when no earlier score in that round and class
-- is higher or equal. A tie leaves the earlier holder in place.
-- Refreshed after a score is written or voided.
CREATE MATERIALIZED VIEW "record_standing" AS
SELECT
    s.id AS "scoreId",
    c."roundId" AS "roundId",
    s."shootingClassId" AS "shootingClassId",
    s."personId" AS "personId",
    s.score AS score,
    c."startsOn" AS "effectiveOn",
    s."createdAt"::date AS "recognisedOn"
FROM "score" s
JOIN "competition" c ON c.id = s."competitionId"
LEFT JOIN "score_void" voided ON voided."scoreId" = s.id
WHERE voided.id IS NULL
    AND c."roundId" IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM "score" earlier
        JOIN "competition" earlier_competition
            ON earlier_competition.id = earlier."competitionId"
        LEFT JOIN "score_void" earlier_void
            ON earlier_void."scoreId" = earlier.id
        WHERE earlier_void.id IS NULL
            AND earlier.id <> s.id
            AND earlier."shootingClassId" = s."shootingClassId"
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
    );

CREATE UNIQUE INDEX "record_standing_scoreId_key" ON "record_standing" ("scoreId");

CREATE FUNCTION refresh_record_standing() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW "record_standing";
  RETURN NULL;
END;
$$;

CREATE TRIGGER score_refresh_record_standing
  AFTER INSERT ON "score"
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_record_standing();

CREATE TRIGGER score_void_refresh_record_standing
  AFTER INSERT ON "score_void"
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_record_standing();
