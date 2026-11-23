import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type {
  ImportCompetition,
  ImportPerson,
  ImportPin,
  ImportScore,
} from "./types.ts";

export type PreparedImport = {
  people: ImportPerson[];
  competitions: ImportCompetition[];
  scores: ImportScore[];
  pins: ImportPin[];
};

export type ImportSummary = {
  people: number;
  competitionsCreated: number;
  competitionsReused: number;
  scoresCreated: number;
  scoresSkipped: number;
  pinsCreated: number;
  pinsSkipped: number;
};

type ReferenceIds = {
  bowStyle: Map<string, string>;
  ageDivision: Map<string, string>;
  awardTrack: Map<string, string>;
  round: Map<string, { id: string; code: string }>;
};

export async function loadIfafImport(
  prisma: PrismaClient,
  data: PreparedImport,
): Promise<ImportSummary> {
  const reference = await loadReference(prisma);
  const approvedById = await upsertApprover(prisma);
  const personIds = await upsertPeople(prisma, data.people, approvedById);
  const competitionState = await upsertCompetitions(prisma, data.competitions, reference);

  const scoresToInsert = data.scores.filter(
    (score) => competitionState.created.has(score.competitionExternalId),
  );
  const skippedExisting = data.scores.length - scoresToInsert.length;

  await insertScoresAndEntries(prisma, scoresToInsert, personIds, competitionState, reference);
  await approveNewSubmissions(prisma, competitionState.createdSubmissionIds, approvedById);

  const pinResult = await upsertPins(prisma, data.pins, personIds, reference);

  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY "record_standing"`;

  return {
    people: personIds.size,
    competitionsCreated: competitionState.created.size,
    competitionsReused: competitionState.reused.size,
    scoresCreated: scoresToInsert.length,
    scoresSkipped: skippedExisting,
    pinsCreated: pinResult.created,
    pinsSkipped: pinResult.skipped,
  };
}

async function loadReference(prisma: PrismaClient): Promise<ReferenceIds> {
  const [styles, divisions, tracks, rounds] = await Promise.all([
    prisma.bowStyle.findMany(),
    prisma.ageDivision.findMany(),
    prisma.awardTrack.findMany(),
    prisma.round.findMany({ select: { id: true, code: true } }),
  ]);
  if (styles.length === 0 || divisions.length === 0 || tracks.length === 0 || rounds.length === 0) {
    throw new Error("Reference seed has not been loaded. Run pnpm db:seed first.");
  }
  return {
    bowStyle: new Map(styles.map((row) => [row.code, row.id])),
    ageDivision: new Map(divisions.map((row) => [row.code, row.id])),
    awardTrack: new Map(tracks.map((row) => [row.code, row.id])),
    round: new Map(rounds.map((row) => [row.code, row])),
  };
}

async function upsertPeople(
  prisma: PrismaClient,
  people: ImportPerson[],
  approvedById: string,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const person of people) {
    const row = await prisma.person.upsert({
      where: { membershipNumber: person.membershipNumber },
      create: { membershipNumber: person.membershipNumber },
      update: {},
      include: { names: true },
    });
    ids.set(person.membershipNumber, row.id);
    await prisma.personName.updateMany({
      where: { personId: row.id, approvedById: null },
      data: { approvedById, approvedAt: new Date() },
    });
    const already = new Set(row.names.map((name) => name.fullName));
    for (const name of person.names) {
      if (already.has(name.fullName)) {
        continue;
      }
      already.add(name.fullName);
      await prisma.personName.create({
        data: {
          personId: row.id,
          fullName: name.fullName,
          note: name.note,
          approvedById,
          approvedAt: new Date(),
        },
      });
    }
  }
  return ids;
}

const APPROVER_NAME = "Membership Secretary";
const APPROVER_EMAIL = "membersec@ifaf.ie";
const APPROVER_ID = "membership-secretary";
const LEGACY_IMPORT_USER_ID = "ifaf-workbook-import";

type CompetitionState = {
  created: Map<string, { competitionId: string; submissionId: string }>;
  reused: Map<string, { competitionId: string; submissionId: string }>;
  createdSubmissionIds: string[];
  byExternalId: Map<string, { competitionId: string; submissionId: string }>;
};

async function upsertCompetitions(
  prisma: PrismaClient,
  competitions: ImportCompetition[],
  reference: ReferenceIds,
): Promise<CompetitionState> {
  const existing = await prisma.scoreSubmission.findMany({
    where: { source: "import", externalId: { not: null } },
    select: { id: true, externalId: true, competitionId: true, status: true },
  });
  const existingByExternalId = new Map(
    existing
      .filter((row) => row.externalId)
      .map((row) => [row.externalId as string, row]),
  );

  const created = new Map<string, { competitionId: string; submissionId: string }>();
  const reused = new Map<string, { competitionId: string; submissionId: string }>();
  const createdSubmissionIds: string[] = [];
  const byExternalId = new Map<string, { competitionId: string; submissionId: string }>();

  for (const competition of competitions) {
    const round = reference.round.get(competition.roundCode);
    if (!round) {
      throw new Error(`Unknown round ${competition.roundCode}`);
    }
    const found = existingByExternalId.get(competition.externalId);
    if (found) {
      const ids = { competitionId: found.competitionId, submissionId: found.id };
      byExternalId.set(competition.externalId, ids);
      const scoreCount = await prisma.score.count({
        where: { competitionId: found.competitionId },
      });
      if (scoreCount > 0) {
        reused.set(competition.externalId, ids);
        if (found.status === "pending") {
          createdSubmissionIds.push(found.id);
        }
        continue;
      }
      if (found.status !== "pending") {
        reused.set(competition.externalId, ids);
        continue;
      }
      created.set(competition.externalId, ids);
      createdSubmissionIds.push(found.id);
      continue;
    }

    const createdCompetition = await prisma.competition.create({
      data: {
        name: competition.name,
        startsOn: competition.startsOn,
        roundCode: competition.roundCode,
        roundId: round.id,
        countsForGains: competition.countsForGains,
        submission: {
          create: {
            status: "pending",
            source: "import",
            externalId: competition.externalId,
          },
        },
      },
      include: { submission: true },
    });
    const submissionId = createdCompetition.submission?.id;
    if (!submissionId) {
      throw new Error(`Missing submission for ${competition.externalId}`);
    }
    const ids = { competitionId: createdCompetition.id, submissionId };
    created.set(competition.externalId, ids);
    byExternalId.set(competition.externalId, ids);
    createdSubmissionIds.push(submissionId);
  }

  return { created, reused, createdSubmissionIds, byExternalId };
}

async function insertScoresAndEntries(
  prisma: PrismaClient,
  scores: ImportScore[],
  personIds: Map<string, string>,
  competitions: CompetitionState,
  reference: ReferenceIds,
) {
  if (scores.length === 0) {
    return;
  }

  await prisma.$executeRaw`ALTER TABLE "score" DISABLE TRIGGER score_refresh_record_standing`;
  try {
    const scoreRows = scores.map((score) => {
      const personId = personIds.get(score.membershipNumber);
      const competition = competitions.byExternalId.get(score.competitionExternalId);
      const bowStyleId = reference.bowStyle.get(score.bowStyleCode);
      const ageDivisionId = reference.ageDivision.get(score.ageDivisionCode);
      if (!personId || !competition || !bowStyleId || !ageDivisionId) {
        throw new Error(
          `Missing reference for score ${score.membershipNumber} ${score.classCode} ${score.competitionExternalId}`,
        );
      }
      return {
        id: randomUUID(),
        personId,
        bowStyleId,
        ageDivisionId,
        gender: score.gender,
        competitionId: competition.competitionId,
        score: score.score,
        submissionId: competition.submissionId,
        membershipNumber: score.membershipNumber,
        archerName: score.archerName,
        classCode: score.classCode,
      };
    });

    await createManyInBatches(
      scoreRows.map(
        ({ id, personId, bowStyleId, ageDivisionId, gender, competitionId, score }) => ({
          id,
          personId,
          bowStyleId,
          ageDivisionId,
          gender,
          competitionId,
          score,
        }),
      ),
      500,
      (data) => prisma.score.createMany({ data }),
    );

    await createManyInBatches(
      scoreRows.map((row) => ({
        submissionId: row.submissionId,
        membershipNumber: row.membershipNumber,
        archerName: row.archerName,
        classCode: row.classCode,
        bowStyleId: row.bowStyleId,
        ageDivisionId: row.ageDivisionId,
        gender: row.gender,
        score: row.score,
        scoreId: row.id,
      })),
      400,
      (data) => prisma.submissionEntry.createMany({ data }),
    );
  } finally {
    await prisma.$executeRaw`ALTER TABLE "score" ENABLE TRIGGER score_refresh_record_standing`;
  }
}

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

async function upsertPins(
  prisma: PrismaClient,
  pins: ImportPin[],
  personIds: Map<string, string>,
  reference: ReferenceIds,
): Promise<{ created: number; skipped: number }> {
  const before = await prisma.gainsAward.count();
  const rows = pins.map((pin) => {
    const personId = personIds.get(pin.membershipNumber);
    const bowStyleId = reference.bowStyle.get(pin.bowStyleCode);
    const ageDivisionId = reference.ageDivision.get(pin.ageDivisionCode);
    const awardTrackId = reference.awardTrack.get(pin.awardTrackCode);
    if (!personId || !bowStyleId || !ageDivisionId || !awardTrackId) {
      throw new Error(`Missing reference for pin ${pin.membershipNumber} ${pin.classCode} ${pin.level}`);
    }
    return {
      personId,
      bowStyleId,
      ageDivisionId,
      gender: pin.gender,
      awardTrackId,
      level: pin.level,
      status: "issued" as const,
    };
  });
  await createManyInBatches(rows, 400, (data) =>
    prisma.gainsAward.createMany({ data, skipDuplicates: true }),
  );
  const after = await prisma.gainsAward.count();
  const created = after - before;
  return { created, skipped: pins.length - created };
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
