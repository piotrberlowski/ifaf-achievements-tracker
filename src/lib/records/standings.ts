import type { RecordStanding } from "@prisma/client";
import { getPrisma } from "../prisma.ts";
import { rounds } from "../reference/catalog.ts";
import type { AgeDivisionCode, AwardTrackCode, BowStyleCode, GenderValue } from "../class-filter.ts";

export type RecordQuery = {
  discipline: AwardTrackCode;
  bow: BowStyleCode[];
  age: AgeDivisionCode[];
  gender: GenderValue | null;
};

const roundOrder = new Map<string, number>(rounds.map((round, index) => [round.code, index]));

export async function findStandingRecords(query: RecordQuery): Promise<RecordStanding[]> {
  const rows = await getPrisma().recordStanding.findMany({
    where: {
      current: true,
      displayOnly: false,
      awardTrackCode: query.discipline,
      bowCode: { in: [...query.bow] },
      ...(query.age.length > 0 ? { ageCode: { in: [...query.age] } } : {}),
      ...(query.gender ? { gender: query.gender } : {}),
    },
  });
  return rows.sort(
    (left, right) => (roundOrder.get(left.roundCode) ?? 0) - (roundOrder.get(right.roundCode) ?? 0),
  );
}
