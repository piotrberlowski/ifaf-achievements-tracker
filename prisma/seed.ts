import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  ageDivisions,
  awardTracks,
  bowStyles,
  rounds,
} from "../src/lib/reference/catalog.ts";

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

async function main() {
  await prisma.$transaction(
    async (tx) => {
      for (const track of awardTracks) {
        await tx.awardTrack.upsert({
          where: { code: track.code },
          create: { code: track.code, name: track.name },
          update: { name: track.name },
        });
      }

      for (const style of bowStyles) {
        await tx.bowStyle.upsert({
          where: { code: style.code },
          create: { code: style.code, name: style.name },
          update: { name: style.name },
        });
      }

      for (const division of ageDivisions) {
        await tx.ageDivision.upsert({
          where: { code: division.code },
          create: { code: division.code, name: division.name },
          update: { name: division.name },
        });
      }

      await tx.ageDivision.deleteMany({
        where: { code: { notIn: ageDivisions.map((division) => division.code) } },
      });

      const tracks = await tx.awardTrack.findMany();
      const trackId = new Map(tracks.map((row) => [row.code, row.id]));

      for (const round of rounds) {
        const awardTrackId = trackId.get(round.awardTrackCode);
        if (!awardTrackId) {
          throw new Error(`Missing award track ${round.awardTrackCode}`);
        }

        await tx.round.upsert({
          where: { code: round.code },
          create: {
            code: round.code,
            name: round.name,
            awardTrackId,
            displayOnly: round.displayOnly,
          },
          update: {
            name: round.name,
            awardTrackId,
            displayOnly: round.displayOnly,
          },
        });
      }
    },
    { timeout: 30_000 },
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
