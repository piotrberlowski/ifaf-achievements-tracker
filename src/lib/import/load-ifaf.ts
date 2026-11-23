import type { Prisma, PrismaClient } from "@prisma/client";
import type { ImportBundle } from "./bundle.ts";
import { codeForId } from "./reference.ts";
import type { ReferenceMaps } from "./reference.ts";

export type ImportSummary = {
  people: number;
  competitionsCreated: number;
  competitionsReused: number;
  scoresCreated: number;
  scoresSkipped: number;
  pinsCreated: number;
  pinsSkipped: number;
};

export async function loadIfafImport(
  prisma: PrismaClient,
  bundle: ImportBundle,
): Promise<ImportSummary> {
  const approvedById = await upsertApprover(prisma);
  await stripWorkbookMembershipPrefix(prisma);
  const personRewrite = await insertPeople(prisma, bundle, approvedById);

  const scores = bundle.scores.map((score) => ({
    ...score,
    personId: personRewrite.get(score.personId) ?? score.personId,
  }));
  const awards = bundle.awards.map((award) => ({
    ...award,
    personId: personRewrite.get(award.personId) ?? award.personId,
  }));

  const competitionState = await insertCompetitions(prisma, bundle);
  const scoresToInsert = scores.filter(
    (score) => !competitionState.skipOriginalCompetitionIds.has(score.competitionId),
  );
  const entriesToInsert = bundle.entries.filter(
    (entry) => !competitionState.skipOriginalSubmissionIds.has(entry.submissionId),
  );

  await insertScoresAndEntries(
    prisma,
    scoresToInsert.map((score) => ({
      ...score,
      competitionId: competitionState.competitionRewrite.get(score.competitionId) ?? score.competitionId,
    })),
    entriesToInsert.map((entry) => ({
      ...entry,
      submissionId: competitionState.submissionRewrite.get(entry.submissionId) ?? entry.submissionId,
    })),
  );
  await approveNewSubmissions(prisma, competitionState.submissionIdsToApprove, approvedById);

  const pinResult = await insertAwards(prisma, awards);

  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY "record_standing"`;

  return {
    people: personRewrite.size,
    competitionsCreated: competitionState.created,
    competitionsReused: competitionState.reused,
    scoresCreated: scoresToInsert.length,
    scoresSkipped: scores.length - scoresToInsert.length,
    pinsCreated: pinResult.created,
    pinsSkipped: pinResult.skipped,
  };
}

async function stripWorkbookMembershipPrefix(prisma: PrismaClient) {
  const people = await prisma.person.findMany({
    select: { membershipNumber: true },
  });
  const stored = new Set(people.map((person) => person.membershipNumber));
  for (const person of people) {
    const bare = person.membershipNumber.match(/^IRE_(\d+)$/i)?.[1];
    if (bare && stored.has(bare)) {
      throw new Error(`Membership ${bare} is already stored with and without the workbook prefix`);
    }
  }
  await prisma.$executeRaw`
    UPDATE "person"
    SET "membershipNumber" = regexp_replace("membershipNumber", '^IRE_', '', 'i')
    WHERE "membershipNumber" ~* '^IRE_[0-9]+$'
  `;
}

async function insertPeople(
  prisma: PrismaClient,
  bundle: ImportBundle,
  approvedById: string,
): Promise<Map<string, string>> {
  const existing = await prisma.person.findMany({
    select: { id: true, membershipNumber: true },
  });
  const membershipToId = new Map(existing.map((row) => [row.membershipNumber, row.id]));
  const rewrite = new Map<string, string>();
  const toInsert: Prisma.PersonCreateManyInput[] = [];

  for (const person of bundle.people) {
    const parsedId = person.id;
    if (!parsedId) {
      throw new Error(`Person ${person.membershipNumber} is missing an id`);
    }
    const existingId = membershipToId.get(person.membershipNumber);
    if (existingId) {
      rewrite.set(parsedId, existingId);
      continue;
    }
    rewrite.set(parsedId, parsedId);
    membershipToId.set(person.membershipNumber, parsedId);
    toInsert.push(person);
  }

  await createManyInBatches(toInsert, 500, (data) => prisma.person.createMany({ data }));

  const names = bundle.names.map((name) => ({
    ...name,
    personId: rewrite.get(name.personId) ?? name.personId,
    approvedById,
    approvedAt: new Date(),
  }));
  const existingNames = await prisma.personName.findMany({
    select: { personId: true, fullName: true },
  });
  const already = new Set(existingNames.map((name) => `${name.personId}|${name.fullName}`));
  const namesToInsert = names.filter((name) => !already.has(`${name.personId}|${name.fullName}`));
  await createManyInBatches(namesToInsert, 400, (data) => prisma.personName.createMany({ data }));

  return rewrite;
}

type CompetitionInsertState = {
  created: number;
  reused: number;
  competitionRewrite: Map<string, string>;
  submissionRewrite: Map<string, string>;
  skipOriginalCompetitionIds: Set<string>;
  skipOriginalSubmissionIds: Set<string>;
  submissionIdsToApprove: string[];
};

async function insertCompetitions(
  prisma: PrismaClient,
  bundle: ImportBundle,
): Promise<CompetitionInsertState> {
  const existing = await prisma.scoreSubmission.findMany({
    where: { source: "import", externalId: { not: null } },
    select: { id: true, externalId: true, competitionId: true, status: true },
  });
  const existingByExternalId = new Map(
    existing
      .filter((row) => row.externalId)
      .map((row) => [row.externalId as string, row]),
  );
  const scoredCompetitions = new Set(
    (
      await prisma.score.findMany({
        where: { competitionId: { in: [...new Set(existing.map((row) => row.competitionId))] } },
        select: { competitionId: true },
        distinct: ["competitionId"],
      })
    ).map((row) => row.competitionId),
  );

  const competitionById = new Map(
    bundle.competitions.map((competition) => [competition.id, competition]),
  );
  const competitionsToInsert: Prisma.CompetitionCreateManyInput[] = [];
  const submissionsToInsert: Prisma.ScoreSubmissionCreateManyInput[] = [];
  const competitionRewrite = new Map<string, string>();
  const submissionRewrite = new Map<string, string>();
  const skipOriginalCompetitionIds = new Set<string>();
  const skipOriginalSubmissionIds = new Set<string>();
  const submissionIdsToApprove: string[] = [];
  let created = 0;
  let reused = 0;

  for (const submission of bundle.submissions) {
    const competition = competitionById.get(submission.competitionId);
    if (!competition) {
      throw new Error(`Missing competition for submission ${submission.externalId}`);
    }
    const found = submission.externalId
      ? existingByExternalId.get(submission.externalId)
      : undefined;
    if (found) {
      competitionRewrite.set(submission.competitionId, found.competitionId);
      if (submission.id) {
        submissionRewrite.set(submission.id, found.id);
      }
      if (scoredCompetitions.has(found.competitionId)) {
        skipOriginalCompetitionIds.add(submission.competitionId);
        skipOriginalSubmissionIds.add(submission.id ?? "");
        reused += 1;
        if (found.status === "pending") {
          submissionIdsToApprove.push(found.id);
        }
        continue;
      }
      if (found.status !== "pending") {
        skipOriginalCompetitionIds.add(submission.competitionId);
        skipOriginalSubmissionIds.add(submission.id ?? "");
        reused += 1;
        continue;
      }
      submissionIdsToApprove.push(found.id);
      created += 1;
      continue;
    }

    competitionsToInsert.push(competition);
    submissionsToInsert.push(submission);
    if (submission.id) {
      submissionIdsToApprove.push(submission.id);
    }
    created += 1;
  }

  await createManyInBatches(competitionsToInsert, 200, (data) =>
    prisma.competition.createMany({ data }),
  );
  await createManyInBatches(submissionsToInsert, 200, (data) =>
    prisma.scoreSubmission.createMany({ data }),
  );

  return {
    created,
    reused,
    competitionRewrite,
    submissionRewrite,
    skipOriginalCompetitionIds,
    skipOriginalSubmissionIds,
    submissionIdsToApprove,
  };
}

async function insertScoresAndEntries(
  prisma: PrismaClient,
  scores: Prisma.ScoreCreateManyInput[],
  entries: Prisma.SubmissionEntryCreateManyInput[],
) {
  if (scores.length === 0) {
    return;
  }

  await prisma.$executeRaw`ALTER TABLE "score" DISABLE TRIGGER score_refresh_record_standing`;
  try {
    await createManyInBatches(scores, 500, (data) => prisma.score.createMany({ data }));
    await createManyInBatches(entries, 400, (data) => prisma.submissionEntry.createMany({ data }));
  } finally {
    await prisma.$executeRaw`ALTER TABLE "score" ENABLE TRIGGER score_refresh_record_standing`;
  }
}

const APPROVER_NAME = "Membership Secretary";
const APPROVER_EMAIL = "membersec@ifaf.ie";
const APPROVER_ID = "membership-secretary";
const LEGACY_IMPORT_USER_ID = "ifaf-workbook-import";

async function upsertApprover(prisma: PrismaClient): Promise<string> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { id: APPROVER_ID },
        { id: LEGACY_IMPORT_USER_ID },
        { email: APPROVER_EMAIL },
        { name: APPROVER_NAME },
      ],
    },
  });
  if (existing) {
    if (existing.name !== APPROVER_NAME || existing.email !== APPROVER_EMAIL) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: APPROVER_NAME, email: APPROVER_EMAIL },
      });
    }
    return existing.id;
  }

  const user = await prisma.user.create({
    data: {
      id: APPROVER_ID,
      name: APPROVER_NAME,
      email: APPROVER_EMAIL,
      emailVerified: true,
    },
  });
  return user.id;
}

async function approveNewSubmissions(
  prisma: PrismaClient,
  submissionIds: string[],
  approvedById: string,
) {
  if (submissionIds.length === 0) {
    return;
  }
  const now = new Date();
  await createManyInBatches(submissionIds, 100, async (batch) => {
    await prisma.scoreSubmission.updateMany({
      where: { id: { in: batch }, status: "pending" },
      data: { status: "approved", approvedAt: now, approvedById },
    });
  });
}

async function insertAwards(
  prisma: PrismaClient,
  awards: Prisma.GainsAwardCreateManyInput[],
): Promise<{ created: number; skipped: number }> {
  const before = await prisma.gainsAward.count();
  await createManyInBatches(awards, 400, (data) =>
    prisma.gainsAward.createMany({ data, skipDuplicates: true }),
  );
  const after = await prisma.gainsAward.count();
  const created = after - before;
  return { created, skipped: awards.length - created };
}

async function createManyInBatches<T>(
  rows: T[],
  size: number,
  write: (batch: T[]) => Promise<unknown>,
) {
  for (let index = 0; index < rows.length; index += size) {
    await write(rows.slice(index, index + size));
  }
}

export type PinKey = {
  membershipNumber: string;
  bowStyleCode: string;
  ageDivisionCode: string;
  gender: "male" | "female";
  awardTrackCode: string;
  level: string;
};

export function pinIdentity(pin: PinKey): string {
  return [
    pin.membershipNumber,
    pin.bowStyleCode,
    pin.ageDivisionCode,
    pin.gender,
    pin.awardTrackCode,
    pin.level,
  ].join("|");
}

export function pinKeysFromBundle(bundle: ImportBundle, maps: ReferenceMaps): PinKey[] {
  const membershipByPersonId = new Map(
    bundle.people.map((person) => [person.id, person.membershipNumber]),
  );
  return bundle.awards.map((award) => ({
    membershipNumber: membershipByPersonId.get(award.personId) ?? award.personId,
    bowStyleCode: codeForId(maps.bowStyleId, award.bowStyleId, "bow style"),
    ageDivisionCode: codeForId(maps.ageDivisionId, award.ageDivisionId, "age division"),
    gender: award.gender,
    awardTrackCode: codeForId(maps.awardTrackId, award.awardTrackId, "award track"),
    level: award.level,
  }));
}

export async function readIssuedPins(prisma: PrismaClient): Promise<PinKey[]> {
  const rows = await prisma.gainsAward.findMany({
    where: { status: "issued" },
    include: {
      person: { select: { membershipNumber: true } },
      bowStyle: { select: { code: true } },
      ageDivision: { select: { code: true } },
      awardTrack: { select: { code: true } },
    },
  });
  return rows.map((row) => ({
    membershipNumber: row.person.membershipNumber,
    bowStyleCode: row.bowStyle.code,
    ageDivisionCode: row.ageDivision.code,
    gender: row.gender,
    awardTrackCode: row.awardTrack.code,
    level: row.level,
  }));
}
