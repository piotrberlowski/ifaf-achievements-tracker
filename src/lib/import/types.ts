import type { PinLevel } from "./tracker.ts";

export type ImportPersonName = {
  fullName: string;
  note: string | null;
};

export type ImportPerson = {
  membershipNumber: string;
  names: ImportPersonName[];
};

export type ImportCompetition = {
  externalId: string;
  name: string;
  startsOn: Date | null;
  roundCode: string;
  countsForGains: boolean;
};

export type ImportScore = {
  competitionExternalId: string;
  membershipNumber: string;
  archerName: string;
  classCode: string;
  bowStyleCode: string;
  ageDivisionCode: string;
  gender: "male" | "female";
  score: number;
};

export type ImportPin = {
  membershipNumber: string;
  classCode: string;
  bowStyleCode: string;
  ageDivisionCode: string;
  gender: "male" | "female";
  awardTrackCode: string;
  level: PinLevel;
};

export type StandingRecord = {
  roundCode: string;
  bowStyleCode: string;
  ageDivisionCode: string;
  gender: "male" | "female";
  holderName: string;
  score: number;
  startsOn: Date | null;
  competitionName: string;
};

export type ParseWarning = {
  sheet: string;
  message: string;
};
