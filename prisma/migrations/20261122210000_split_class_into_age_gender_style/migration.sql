-- Scores, awards, and the record view reference bow style, age division,
-- and gender directly. The written class code is those three parts.

DROP MATERIALIZED VIEW "record_standing";

-- DropForeignKey
ALTER TABLE "gains_award" DROP CONSTRAINT "gains_award_shootingClassId_fkey";

-- DropForeignKey
ALTER TABLE "score" DROP CONSTRAINT "score_shootingClassId_fkey";

-- DropForeignKey
ALTER TABLE "shooting_class" DROP CONSTRAINT "shooting_class_ageDivisionId_fkey";

-- DropForeignKey
ALTER TABLE "shooting_class" DROP CONSTRAINT "shooting_class_bowStyleId_fkey";

-- DropForeignKey
ALTER TABLE "submission_entry" DROP CONSTRAINT "submission_entry_shootingClassId_fkey";

-- DropIndex
DROP INDEX "gains_award_personId_shootingClassId_awardTrackId_level_key";

-- DropIndex
DROP INDEX "score_personId_shootingClassId_idx";

-- AlterTable
ALTER TABLE "age_division" DROP COLUMN "gender";

-- AlterTable
ALTER TABLE "gains_award" DROP COLUMN "shootingClassId",
ADD COLUMN     "ageDivisionId" TEXT NOT NULL,
ADD COLUMN     "bowStyleId" TEXT NOT NULL,
ADD COLUMN     "gender" "division_gender" NOT NULL;

-- AlterTable
ALTER TABLE "score" DROP COLUMN "shootingClassId",
ADD COLUMN     "ageDivisionId" TEXT NOT NULL,
ADD COLUMN     "bowStyleId" TEXT NOT NULL,
ADD COLUMN     "gender" "division_gender" NOT NULL;

-- AlterTable
ALTER TABLE "submission_entry" DROP COLUMN "shootingClassId",
ADD COLUMN     "ageDivisionId" TEXT,
ADD COLUMN     "bowStyleId" TEXT,
ADD COLUMN     "gender" "division_gender";

-- DropTable
DROP TABLE "shooting_class";

-- The previous rows were age-and-gender prefixes. Age is now the band alone.
DELETE FROM "age_division";

-- CreateIndex
CREATE INDEX "gains_award_bowStyleId_ageDivisionId_gender_idx" ON "gains_award"("bowStyleId", "ageDivisionId", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "gains_award_personId_bowStyleId_ageDivisionId_gender_awardT_key" ON "gains_award"("personId", "bowStyleId", "ageDivisionId", "gender", "awardTrackId", "level");

-- CreateIndex
CREATE INDEX "score_bowStyleId_ageDivisionId_gender_idx" ON "score"("bowStyleId", "ageDivisionId", "gender");

-- CreateIndex
CREATE INDEX "score_personId_bowStyleId_ageDivisionId_gender_idx" ON "score"("personId", "bowStyleId", "ageDivisionId", "gender");

-- CreateIndex
CREATE INDEX "submission_entry_bowStyleId_ageDivisionId_gender_idx" ON "submission_entry"("bowStyleId", "ageDivisionId", "gender");

-- AddForeignKey
ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_bowStyleId_fkey" FOREIGN KEY ("bowStyleId") REFERENCES "bow_style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_entry" ADD CONSTRAINT "submission_entry_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_bowStyleId_fkey" FOREIGN KEY ("bowStyleId") REFERENCES "bow_style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gains_award" ADD CONSTRAINT "gains_award_bowStyleId_fkey" FOREIGN KEY ("bowStyleId") REFERENCES "bow_style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gains_award" ADD CONSTRAINT "gains_award_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A score sets the record when no earlier score in that round, bow style,
-- age division, and gender is higher or equal. A tie leaves the earlier holder.
CREATE MATERIALIZED VIEW "record_standing" AS
SELECT
    s.id AS "scoreId",
    c."roundId" AS "roundId",
    s."bowStyleId" AS "bowStyleId",
    s."ageDivisionId" AS "ageDivisionId",
    s.gender AS gender,
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
    );

CREATE UNIQUE INDEX "record_standing_scoreId_key" ON "record_standing" ("scoreId");

CREATE INDEX "record_standing_bowStyleId_ageDivisionId_gender_idx"
    ON "record_standing" ("bowStyleId", "ageDivisionId", gender);
