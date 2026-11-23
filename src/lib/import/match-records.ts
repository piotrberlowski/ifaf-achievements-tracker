import { randomUUID } from "node:crypto";
import { DivisionGender } from "@prisma/client";
import type { ImportBundle } from "./bundle.ts";
import { registerPerson } from "./bundle.ts";
import { namesMatch, unmatchedMembershipNumber } from "./names.ts";
import { codeForId, type ReferenceMaps } from "./reference.ts";
import type { parseRecordsWorkbook } from "./records-workbook.ts";

type RecordSheetRow = Awaited<ReturnType<typeof parseRecordsWorkbook>>["records"][number];

export function matchStandingRecords(
  records: RecordSheetRow[],
  bundle: ImportBundle,
  maps: ReferenceMaps,
): { matched: number } {
  const competitionById = new Map(
    bundle.competitions.map((competition) => [competition.id, competition]),
  );
  const entryByScoreId = new Map(
    bundle.entries.flatMap((entry) => (entry.scoreId ? [[entry.scoreId, entry] as const] : [])),
  );
  const byRoundClassScore = new Map<string, typeof bundle.scores>();
  for (const score of bundle.scores) {
    const competition = competitionById.get(score.competitionId);
    if (!competition?.roundId) {
      continue;
    }
    const key = scoreKey(
      competition.roundId,
      score.bowStyleId,
      score.ageDivisionId,
      score.gender,
      score.score,
    );
    const list = byRoundClassScore.get(key);
    if (list) {
      list.push(score);
    } else {
      byRoundClassScore.set(key, [score]);
    }
  }

  const peopleByNumber = new Map(
    bundle.people.map((person) => [person.membershipNumber, person.id as string]),
  );
  let matched = 0;

  for (const record of records) {
    const candidates = byRoundClassScore.get(
      scoreKey(record.roundId, record.bowStyleId, record.ageDivisionId, record.gender, record.score),
    ) ?? [];
    const held = candidates.filter((score) => {
      const entry = score.id ? entryByScoreId.get(score.id) : undefined;
      return entry ? namesMatch(entry.archerName, record.holderName) : false;
    });
    if (held.length > 0) {
      matched += 1;
      if (held.length > 1) {
        bundle.warnings.push({
          sheet: "records",
          message: `${record.holderName} holds ${held.length} GAINS scores of ${record.score} on ${record.roundCode}`,
        });
      }
      continue;
    }

    const sameName = peopleNamed(record.holderName, bundle);
    if (sameName.length > 1) {
      bundle.warnings.push({
        sheet: "records",
        message: `several members are named ${record.holderName}, and none of their GAINS scores is this ${record.roundCode} ${record.score}`,
      });
      continue;
    }

    const personId =
      sameName[0]?.id ??
      registerPerson(
        bundle,
        peopleByNumber,
        unmatchedMembershipNumber(record.holderName),
        record.holderName.trim(),
        null,
      );
    const person = bundle.people.find((row) => row.id === personId);
    const membershipNumber = person?.membershipNumber ?? unmatchedMembershipNumber(record.holderName);
    const competitionId = randomUUID();
    const submissionId = randomUUID();
    const scoreId = randomUUID();
    const classCode = [
      codeForId(maps.ageDivisionId, record.ageDivisionId, "age division"),
      record.gender === DivisionGender.female ? "F" : "M",
      codeForId(maps.bowStyleId, record.bowStyleId, "bow style"),
    ].join("");

    bundle.competitions.push({
      id: competitionId,
      name: record.competitionName,
      startsOn: record.startsOn,
      roundCode: record.roundCode,
      roundId: record.roundId,
      countsForGains: false,
    });
    bundle.submissions.push({
      id: submissionId,
      competitionId,
      status: "pending",
      source: "import",
      externalId: [
        "record",
        record.roundCode,
        codeForId(maps.ageDivisionId, record.ageDivisionId, "age division"),
        record.gender,
        codeForId(maps.bowStyleId, record.bowStyleId, "bow style"),
        slug(record.holderName),
        String(record.score),
      ].join(":"),
    });
    bundle.scores.push({
      id: scoreId,
      personId,
      bowStyleId: record.bowStyleId,
      ageDivisionId: record.ageDivisionId,
      gender: record.gender,
      competitionId,
      score: record.score,
    });
    bundle.entries.push({
      submissionId,
      membershipNumber,
      archerName: record.holderName.trim(),
      classCode,
      bowStyleId: record.bowStyleId,
      ageDivisionId: record.ageDivisionId,
      gender: record.gender,
      score: record.score,
      scoreId,
    });
  }

  return { matched };
}

function scoreKey(
  roundId: string,
  bowStyleId: string,
  ageDivisionId: string,
  gender: DivisionGender,
  score: number,
): string {
  return `${roundId}|${bowStyleId}|${ageDivisionId}|${gender}|${score}`;
}

function peopleNamed(holderName: string, bundle: ImportBundle) {
  return bundle.people.filter((person) =>
    bundle.names.some(
      (name) => name.personId === person.id && namesMatch(name.fullName, holderName),
    ),
  );
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "holder"
  );
}
