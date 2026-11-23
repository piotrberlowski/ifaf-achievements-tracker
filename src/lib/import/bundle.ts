import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

export type ImportBundle = {
  people: Prisma.PersonCreateManyInput[];
  names: Prisma.PersonNameCreateManyInput[];
  competitions: Prisma.CompetitionCreateManyInput[];
  submissions: Prisma.ScoreSubmissionCreateManyInput[];
  scores: Prisma.ScoreCreateManyInput[];
  entries: Prisma.SubmissionEntryCreateManyInput[];
  awards: Prisma.GainsAwardCreateManyInput[];
  warnings: { sheet: string; message: string }[];
};

export function emptyBundle(): ImportBundle {
  return {
    people: [],
    names: [],
    competitions: [],
    submissions: [],
    scores: [],
    entries: [],
    awards: [],
    warnings: [],
  };
}

export function registerPerson(
  bundle: ImportBundle,
  peopleByNumber: Map<string, string>,
  membershipNumber: string,
  fullName: string,
  note: string | null,
): string {
  let personId = peopleByNumber.get(membershipNumber);
  if (!personId) {
    personId = randomUUID();
    peopleByNumber.set(membershipNumber, personId);
    bundle.people.push({ id: personId, membershipNumber });
  }
  if (!bundle.names.some((name) => name.personId === personId && name.fullName === fullName)) {
    bundle.names.push({ personId, fullName, note });
  }
  return personId;
}
