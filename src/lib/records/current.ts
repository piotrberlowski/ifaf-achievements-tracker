export type HeldRecord = {
  bowCode: string;
  roundCode: string;
  ageCode: string;
  gender: string;
  score: number;
  achievedOn: Date | null;
  scoreId: string;
  recognisedAt: Date;
};

// record_standing keeps each score that set a record, including scores a
// later one has broken. The current holder is the highest score. An equal
// score leaves the earlier holder in place.
export function chooseCurrentRecords<T extends HeldRecord>(candidates: T[]): T[] {
  const best = new Map<string, T>();
  for (const candidate of candidates) {
    const key = `${candidate.bowCode}\0${candidate.roundCode}\0${candidate.ageCode}\0${candidate.gender}`;
    const current = best.get(key);
    if (!current || holdsOver(candidate, current)) {
      best.set(key, candidate);
    }
  }
  return [...best.values()];
}

function holdsOver(candidate: HeldRecord, current: HeldRecord): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }
  const shot = compareShotDate(candidate.achievedOn, current.achievedOn);
  if (shot !== 0) {
    return shot < 0;
  }
  const recognised =
    candidate.recognisedAt.getTime() - current.recognisedAt.getTime();
  if (recognised !== 0) {
    return recognised < 0;
  }
  return candidate.scoreId < current.scoreId;
}

function compareShotDate(left: Date | null, right: Date | null): number {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return left.getTime() - right.getTime();
}
