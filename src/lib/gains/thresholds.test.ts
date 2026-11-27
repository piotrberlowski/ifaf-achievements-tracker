import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StandingRecord } from "../records/view-filter.ts";
import { standingThresholds } from "./thresholds.ts";

const standing: StandingRecord = {
  roundCode: "UAR",
  roundName: "Unmarked animal",
  awardTrackCode: "ANIMAL",
  bowCode: "FU",
  ageCode: "A",
  gender: "male",
  score: 560,
  effectiveOn: null,
  eventName: "Imported record",
  holder: "Archer One",
};

describe("standingThresholds", () => {
  it("sets Bronze, Silver, Gold, and Star from the standing record", () => {
    assert.deepEqual(standingThresholds([standing]), [
      {
        roundCode: "UAR",
        roundName: "Unmarked animal",
        ageDivisionCode: "A",
        ageDivisionName: "Adult",
        gender: "male",
        genderName: "Male",
        record: 560,
        holderName: "Archer One",
        bronze: 280,
        silver: 392,
        gold: 448,
        star: 504,
      },
    ]);
  });
});
