import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  parseIdentityCorrectionsCsv,
  unappliedCorrections,
} from "../src/lib/import/corrections.ts";
import { parseGainsWorkbook } from "../src/lib/import/gains-workbook.ts";
import {
  loadIfafImport,
  pinIdentity,
  pinKeysFromBundle,
  readIssuedPins,
} from "../src/lib/import/load-ifaf.ts";
import { matchStandingRecords } from "../src/lib/import/match-records.ts";
import { parseRecordsWorkbook } from "../src/lib/import/records-workbook.ts";
import { loadReferenceMaps } from "../src/lib/import/reference.ts";

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

  const maps = await loadReferenceMaps(prisma);
  const corrections = parseIdentityCorrectionsCsv(readFileSync(correctionsPath, "utf8"));
  const bundle = await parseGainsWorkbook(gainsPath, maps, corrections);
  const records = await parseRecordsWorkbook(recordsPath, maps);
  const gainsScoreCount = bundle.scores.length;
  const matched = matchStandingRecords(records.records, bundle, maps);

  for (const warning of [...bundle.warnings, ...records.warnings]) {
    console.warn(`${warning.sheet}: ${warning.message}`);
  }

  const summary = await loadIfafImport(prisma, bundle);

  const leftoverCorrections = unappliedCorrections(corrections, bundle.entries);
  const issued = await readIssuedPins(prisma);
  const sheetKeys = new Set(pinKeysFromBundle(bundle, maps).map(pinIdentity));
  const dbKeys = new Set(issued.map(pinIdentity));
  const missing = [...sheetKeys].filter((key) => !dbKeys.has(key)).sort();
  const extra = [...dbKeys].filter((key) => !sheetKeys.has(key)).sort();

  const standing = await prisma.recordStanding.count();
  const gainsScores = await prisma.score.count({
    where: { competition: { countsForGains: true } },
  });
  const allScores = await prisma.score.count();

  console.log(
    JSON.stringify(
      {
        parsed: {
          gainsScores: gainsScoreCount,
          standingRecords: records.records.length,
          standingMatchedToGains: matched.matched,
          recordOnlyScores: bundle.scores.length - gainsScoreCount,
          issuedPinsOnSheet: bundle.awards.length,
          people: bundle.people.length,
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
        identityCorrections: {
          applied: corrections.length - leftoverCorrections.length,
          leftover: leftoverCorrections,
        },
      },
      null,
      2,
    ),
  );

  if (gainsScoreCount !== 7746) {
    console.warn(`Expected 7746 GAINS scores, parsed ${gainsScoreCount}`);
  }
  if (records.records.length !== 853) {
    console.warn(`Expected 853 standing records, parsed ${records.records.length}`);
  }
  if (missing.length > 0 || extra.length > 0) {
    process.exitCode = 1;
  }
  if (leftoverCorrections.length > 0) {
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
