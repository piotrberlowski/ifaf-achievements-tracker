import { DivisionGender } from "@prisma/client";
import { getPrisma } from "../prisma.ts";
import { chooseCurrentRecords } from "./current.ts";
import { ageDivisions, bowStyles, genders, rounds } from "../reference/catalog.ts";
import type {
  AgeDivisionCode,
  AwardTrackCode,
  BowStyleCode,
  GenderValue,
} from "../class-filter.ts";

export type RecordQuery = {
  discipline: AwardTrackCode;
  bow: BowStyleCode[];
  age: AgeDivisionCode[];
  gender: GenderValue | null;
};

export type StandingRecord = {
  bowCode: string;
  bowName: string;
  roundCode: string;
  roundName: string;
  ageCode: string;
  ageName: string;
  gender: GenderValue;
  genderName: string;
  score: number;
  holder: string;
  achievedOn: Date | null;
  eventName: string;
};

type RecordCandidate = StandingRecord & {
  scoreId: string;
  recognisedAt: Date;
};

const bowOrder = new Map<string, number>(
  bowStyles.map((style, index) => [style.code, index]),
);
const roundOrder = new Map<string, number>(
  rounds.map((round, index) => [round.code, index]),
);
const roundNames = new Map<string, string>(
  rounds.map((round) => [round.code, round.name]),
);
const ageOrder = new Map<string, number>(
  ageDivisions.map((division, index) => [division.code, index]),
);
const ageNames = new Map<string, string>(
  ageDivisions.map((division) => [division.code, division.name]),
);
const genderOrder = new Map<string, number>(
  genders.map((gender, index) => [gender.value, index]),
);
const genderNames = new Map<string, string>(
  genders.map((gender) => [gender.value, gender.name]),
);

export async function findStandingRecords(
  query: RecordQuery,
): Promise<StandingRecord[]> {
  const prisma = getPrisma();
  const roundCodes = rounds
    .filter(
      (round) => round.awardTrackCode === query.discipline && !round.displayOnly,
    )
    .map((round) => round.code);

  const [trackRounds, styles, divisions] = await Promise.all([
    prisma.round.findMany({
      where: { code: { in: [...roundCodes] }, displayOnly: false },
      select: { id: true },
    }),
    prisma.bowStyle.findMany({
      where: { code: { in: query.bow } },
      select: { id: true },
    }),
    query.age.length > 0
      ? prisma.ageDivision.findMany({
          where: { code: { in: query.age } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (
    styles.length === 0 ||
    trackRounds.length === 0 ||
    (query.age.length > 0 && divisions.length === 0)
  ) {
    return [];
  }

  const standings = await prisma.recordStanding.findMany({
    where: {
      roundId: { in: trackRounds.map((round) => round.id) },
      bowStyleId: { in: styles.map((style) => style.id) },
      ...(divisions.length > 0
        ? { ageDivisionId: { in: divisions.map((division) => division.id) } }
        : {}),
      ...(query.gender
        ? { gender: query.gender === "male" ? DivisionGender.male : DivisionGender.female }
        : {}),
    },
    select: { scoreId: true },
  });
  if (standings.length === 0) {
    return [];
  }

  const scores = await prisma.score.findMany({
    where: { id: { in: standings.map((standing) => standing.scoreId) } },
    select: {
      id: true,
      score: true,
      gender: true,
      createdAt: true,
      ageDivision: { select: { code: true, name: true } },
      bowStyle: { select: { code: true, name: true } },
      competition: {
        select: {
          name: true,
          startsOn: true,
          round: { select: { code: true, name: true } },
        },
      },
      person: {
        select: {
          names: {
            orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
            select: { fullName: true, approvedAt: true },
          },
        },
      },
    },
  });

  const candidates: RecordCandidate[] = scores.flatMap((score) => {
    const round = score.competition.round;
    if (!round) {
      return [];
    }
    const approved = score.person.names.find((name) => name.approvedAt);
    const gender = score.gender === DivisionGender.male ? "male" : "female";
    return [
      {
        scoreId: score.id,
        recognisedAt: score.createdAt,
        bowCode: score.bowStyle.code,
        bowName: score.bowStyle.name,
        roundCode: round.code,
        roundName: roundNames.get(round.code) ?? round.name,
        ageCode: score.ageDivision.code,
        ageName: ageNames.get(score.ageDivision.code) ?? score.ageDivision.name,
        gender,
        genderName: genderNames.get(gender) ?? gender,
        score: score.score,
        holder:
          approved?.fullName ?? score.person.names[0]?.fullName ?? "Unknown archer",
        achievedOn: score.competition.startsOn,
        eventName: score.competition.name,
      },
    ];
  });
  const current = chooseCurrentRecords(candidates);

  return current
    .map((record) => ({
      bowCode: record.bowCode,
      bowName: record.bowName,
      roundCode: record.roundCode,
      roundName: record.roundName,
      ageCode: record.ageCode,
      ageName: record.ageName,
      gender: record.gender,
      genderName: record.genderName,
      score: record.score,
      holder: record.holder,
      achievedOn: record.achievedOn,
      eventName: record.eventName,
    }))
    .sort(compareRecords);
}

function compareRecords(left: StandingRecord, right: StandingRecord): number {
  const byRound = (roundOrder.get(left.roundCode) ?? 0) - (roundOrder.get(right.roundCode) ?? 0);
  if (byRound !== 0) return byRound;
  const byBow = (bowOrder.get(left.bowCode) ?? 0) - (bowOrder.get(right.bowCode) ?? 0);
  if (byBow !== 0) return byBow;
  const byAge = (ageOrder.get(left.ageCode) ?? 0) - (ageOrder.get(right.ageCode) ?? 0);
  if (byAge !== 0) return byAge;
  return (genderOrder.get(left.gender) ?? 0) - (genderOrder.get(right.gender) ?? 0);
}
