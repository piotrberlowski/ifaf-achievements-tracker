import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allAges, allBows, narrowSelection, recordIsVisible, type StandingRecord } from "./view-filter.ts";

const record: StandingRecord = {
  roundCode: "SBG",
  roundName: "Standard Big Game",
  awardTrackCode: "ANIMAL",
  bowCode: "BH-R",
  ageCode: "A",
  gender: "male",
  score: 616,
  effectiveOn: "2023-03-12T00:00:00.000Z",
  eventName: "Dunbrody Archers",
  holder: "Daly Mark",
};

describe("narrowSelection", () => {
  it("isolates one category when every category is selected", () => {
    assert.deepEqual(narrowSelection(allBows, "BH-R", allBows), ["BH-R"]);
  });

  it("adds a category to a narrower selection", () => {
    assert.deepEqual(narrowSelection(["BH-R"], "BB-R", allBows), ["BH-R", "BB-R"]);
  });

  it("removes one category and keeps the last selected category", () => {
    assert.deepEqual(narrowSelection(["BH-R", "BB-R"], "BB-R", allBows), ["BH-R"]);
    assert.deepEqual(narrowSelection(["BH-R"], "BH-R", allBows), ["BH-R"]);
  });

  it("isolates one age group from the full set", () => {
    assert.deepEqual(narrowSelection(allAges, "A", allAges), ["A"]);
  });
});

describe("recordIsVisible", () => {
  const view = {
    discipline: "ANIMAL" as const,
    bow: "BH-R" as const,
    ages: ["A" as const],
    genders: ["male" as const],
  };

  it("keeps a record in the selected class", () => {
    assert.equal(recordIsVisible(record, view), true);
  });

  it("hides a record outside the selected discipline or bow", () => {
    assert.equal(recordIsVisible(record, { ...view, discipline: "FIELD" }), false);
    assert.equal(recordIsVisible(record, { ...view, bow: "LB" }), false);
  });
});
