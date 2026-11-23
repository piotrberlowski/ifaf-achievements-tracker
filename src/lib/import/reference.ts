import type { PrismaClient } from "@prisma/client";
import {
  ageDivisions,
  awardTracks,
  bowStyles,
  rounds,
} from "../reference/catalog.ts";

export type ReferenceMaps = {
  bowStyleId: Map<string, string>;
  ageDivisionId: Map<string, string>;
  awardTrackId: Map<string, string>;
  round: Map<string, { id: string; code: string }>;
};

export async function loadReferenceMaps(prisma: PrismaClient): Promise<ReferenceMaps> {
  const [styles, divisions, tracks, roundRows] = await Promise.all([
    prisma.bowStyle.findMany({ select: { id: true, code: true } }),
    prisma.ageDivision.findMany({ select: { id: true, code: true } }),
    prisma.awardTrack.findMany({ select: { id: true, code: true } }),
    prisma.round.findMany({ select: { id: true, code: true } }),
  ]);
  if (styles.length === 0 || divisions.length === 0 || tracks.length === 0 || roundRows.length === 0) {
    throw new Error("Reference seed has not been loaded. Run pnpm db:seed first.");
  }
  return {
    bowStyleId: new Map(styles.map((row) => [row.code, row.id])),
    ageDivisionId: new Map(divisions.map((row) => [row.code, row.id])),
    awardTrackId: new Map(tracks.map((row) => [row.code, row.id])),
    round: new Map(roundRows.map((row) => [row.code, row])),
  };
}

export function referenceMapsFromCatalog(): ReferenceMaps {
  return {
    bowStyleId: new Map(bowStyles.map((style) => [style.code, `bow:${style.code}`])),
    ageDivisionId: new Map(ageDivisions.map((division) => [division.code, `age:${division.code}`])),
    awardTrackId: new Map(awardTracks.map((track) => [track.code, `track:${track.code}`])),
    round: new Map(rounds.map((round) => [round.code, { id: `round:${round.code}`, code: round.code }])),
  };
}

export function requiredId(map: Map<string, string>, code: string, label: string): string {
  const id = map.get(code);
  if (!id) {
    throw new Error(`Unknown ${label} ${code}`);
  }
  return id;
}

export function requiredRound(maps: ReferenceMaps, code: string): { id: string; code: string } {
  const round = maps.round.get(code);
  if (!round) {
    throw new Error(`Unknown round ${code}`);
  }
  return round;
}

export function codeForId(map: Map<string, string>, id: string, label: string): string {
  for (const [code, value] of map) {
    if (value === id) {
      return code;
    }
  }
  throw new Error(`Unknown ${label} id`);
}

export function roundCodeForId(maps: ReferenceMaps, roundId: string): string {
  for (const [code, round] of maps.round) {
    if (round.id === roundId) {
      return code;
    }
  }
  throw new Error(`Unknown round id`);
}
