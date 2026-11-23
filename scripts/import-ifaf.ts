import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { parseIdentityCorrectionsCsv } from "../src/lib/import/corrections.ts";
import { parseGainsWorkbook } from "../src/lib/import/gains-workbook.ts";
import {
  loadIfafImport,
  pinIdentity,
  readIssuedPins,
} from "../src/lib/import/load-ifaf.ts";
import { matchStandingRecords } from "../src/lib/import/match-records.ts";
import { parseRecordsWorkbook } from "../src/lib/import/records-workbook.ts";

const connectionString =
  process.env.IFAF_AT_POSTGRES_URL_NON_POOLING ??
  process.env.IFAF_AT_POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "IFAF_AT_POSTGRES_URL_NON_POOLING or IFAF_AT_POSTGRES_PRISMA_URL is not set",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    return process.argv[index + 1];
  }
  return undefined;
}

async function main() {
  const gainsPath =
    arg("gains") ?? process.env.IFAF_GAINS_XLSX ?? "data/gains.xlsx";
  const recordsPath =
    arg("records") ?? process.env.IFAF_RECORDS_XLSX ?? "data/records.xlsx";
  const correctionsPath =
    arg("corrections") ??
    process.env.IFAF_IDENTITY_CORRECTIONS ??
    "data/identity-corrections.csv";

  const corrections = parseIdentityCorrectionsCsv(readFileSync(correctionsPath, "utf8"));
  const gains = await parseGainsWorkbook(gainsPath, corrections);
  const records = await parseRecordsWorkbook(recordsPath);
  const competitionRounds = new Map(
    gains.competitions.map((competition) => [competition.externalId, competition.roundCode]),
  );
  const matched = matchStandingRecords(
    records.records,
    gains.people,
    gains.scores,
    competitionRounds,
  );

  const peopleByNumber = new Map(
    gains.people.map((person) => [person.membershipNumber, person]),
  );
  for (const person of matched.people) {
    if (!peopleByNumber.has(person.membershipNumber)) {
      gains.people.push(person);
    }
  }

  for (const warning of [...gains.warnings, ...records.warnings]) {
    console.warn(`${warning.sheet}: ${warning.message}`);
  }

  const summary = await loadIfafImport(prisma, {
    people: gains.people,
    competitions: [...gains.competitions, ...matched.competitions],
    scores: [...gains.scores, ...matched.scores],
    pins: gains.pins,
  });

  const issued = await readIssuedPins(prisma);
  const sheetKeys = new Set(gains.pins.map(pinIdentity));
  const dbKeys = new Set(issued.map(pinIdentity));
  const missing = [...sheetKeys].filter((key) => !dbKeys.has(key)).sort();
  const extra = [...dbKeys].filter((key) => !sheetKeys.has(key)).sort();

  const una = await prisma.score.findMany({
    where: { person: { membershipNumber: "IRE_17010" } },
    include: { person: { include: { names: true } }, competition: true },
  });
  const david = await prisma.score.findMany({
    where: { person: { membershipNumber: "IRE_17011" } },
    include: { competition: true },
  });
  const sbgOnUna = una.filter((row) => row.competition.roundCode === "SBG");
  const davidSbg = david.filter((row) => row.competition.roundCode === "SBG");

  const standing = await prisma.recordStanding.count();
  const gainsScores = await prisma.score.count({
    where: { competition: { countsForGains: true } },
  });
  const allScores = await prisma.score.count();

  console.log(
    JSON.stringify(
      {
        parsed: {
          gainsScores: gains.scores.length,
          standingRecords: records.records.length,
          standingMatchedToGains: matched.matched,
          recordOnlyScores: matched.scores.length,
          issuedPinsOnSheet: gains.pins.length,
          people: gains.people.length,
        },
        loaded: {
          ...summary,
          gainsScores,
          allScores,
          recordStandings: standing,
        },
        pins: {
          sheet: sheetKeys.size,
          database: dbKeys.size,
          missingFromDatabase: missing.length,
          extraInDatabase: extra.length,
          missing,
          extra,
        },
        dempsey: {
          unaScoreCount: una.length,
          sbgScoresOnUna: sbgOnUna.length,
          davidSbgScores: davidSbg.length,
        },
      },
      null,
      2,
    ),
  );

  if (gains.scores.length !== 7746) {
    console.warn(`Expected 7746 GAINS scores, parsed ${gains.scores.length}`);
  }
  if (records.records.length !== 853) {
    console.warn(`Expected 853 standing records, parsed ${records.records.length}`);
  }
  if (missing.length > 0 || extra.length > 0) {
    process.exitCode = 1;
  }
  if (sbgOnUna.length > 0 || davidSbg.length === 0) {
    process.exitCode = 1;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
