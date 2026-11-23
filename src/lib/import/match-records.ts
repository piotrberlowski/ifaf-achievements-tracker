import { namesMatch, unmatchedMembershipNumber } from "./names.ts";
import type {
  ImportCompetition,
  ImportPerson,
  ImportScore,
  StandingRecord,
} from "./types.ts";

export type MatchedRecords = {
  matched: number;
  competitions: ImportCompetition[];
  scores: ImportScore[];
  people: ImportPerson[];
};

export function matchStandingRecords(
  records: StandingRecord[],
  people: ImportPerson[],
  gainsScores: ImportScore[],
  competitionRounds: Map<string, string>,
): MatchedRecords {
  const byRoundClassScore = new Map<string, ImportScore[]>();
  for (const score of gainsScores) {
    const roundCode = competitionRounds.get(score.competitionExternalId);
    if (!roundCode) {
      continue;
    }
    const key = scoreKey(roundCode, score);
    const list = byRoundClassScore.get(key);
    if (list) {
      list.push(score);
    } else {
      byRoundClassScore.set(key, [score]);
    }
  }

  let matched = 0;
  const competitions: ImportCompetition[] = [];
  const scores: ImportScore[] = [];
  const extraPeople = new Map<string, ImportPerson>();

  for (const record of records) {
    const candidates = byRoundClassScore.get(scoreKey(record.roundCode, record)) ?? [];
    const named = candidates.filter((score) => namesMatch(score.archerName, record.holderName));
    if (named[0] || candidates.length === 1) {
      matched += 1;
      continue;
    }

    const membershipNumber = resolveHolder(record.holderName, people, extraPeople);
    const externalId = [
      "record",
      record.roundCode,
      record.ageDivisionCode,
      record.gender,
      record.bowStyleCode,
      slug(record.holderName),
      String(record.score),
    ].join(":");

    competitions.push({
      externalId,
      name: record.competitionName,
      startsOn: record.startsOn,
      roundCode: record.roundCode,
      countsForGains: false,
    });
    scores.push({
      competitionExternalId: externalId,
      membershipNumber,
      archerName: record.holderName.trim(),
      classCode: `${record.ageDivisionCode}${record.gender === "female" ? "F" : "M"}${record.bowStyleCode}`,
      bowStyleCode: record.bowStyleCode,
      ageDivisionCode: record.ageDivisionCode,
      gender: record.gender,
      score: record.score,
    });
  }

  return {
    matched,
    competitions,
    scores,
    people: [...extraPeople.values()],
  };
}

function scoreKey(
  roundCode: string,
  score: Pick<ImportScore, "bowStyleCode" | "ageDivisionCode" | "gender" | "score"> | StandingRecord,
): string {
  return `${roundCode}|${score.bowStyleCode}|${score.ageDivisionCode}|${score.gender}|${score.score}`;
}

function resolveHolder(
  holderName: string,
  people: ImportPerson[],
  extraPeople: Map<string, ImportPerson>,
): string {
  const matches = people.filter((person) =>
    person.names.some((name) => namesMatch(name.fullName, holderName)),
  );
  if (matches.length === 1) {
    return matches[0].membershipNumber;
  }
  if (matches.length > 1) {
    const ire = matches.filter((person) => person.membershipNumber.startsWith("IRE_"));
    return ire[0]?.membershipNumber ?? matches[0].membershipNumber;
  }

  const membershipNumber = unmatchedMembershipNumber(holderName);
  if (
    !extraPeople.has(membershipNumber) &&
    !people.some((person) => person.membershipNumber === membershipNumber)
  ) {
    extraPeople.set(membershipNumber, {
      membershipNumber,
      names: [{ fullName: holderName.trim(), note: null }],
    });
  }
  return membershipNumber;
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
