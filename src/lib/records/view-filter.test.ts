import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allAges,
  allBows,
  groupStandingsByRound,
  narrowSelection,
  recordIsVisible,
  withStandingDefaults,
  type StandingRecord,
} from "./view-filter.ts";

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

describe("withStandingDefaults", () => {
  it("opens Animal and the first bow when the query is empty", () => {
    const parsed = withStandingDefaults({
      discipline: null,
      round: null,
      bow: null,
      bows: [],
      age: null,
      ages: [],
      gender: null,
      errors: [],
    });
    assert.equal(parsed.discipline, "ANIMAL");
    assert.equal(parsed.bow, allBows[0]);
    assert.deepEqual(parsed.bows, [allBows[0]]);
  });
});

describe("groupStandingsByRound", () => {
  it("keeps consecutive rows for the same round together", () => {
    const field = { ...record, roundCode: "FIELD", roundName: "Field" };
    const groups = groupStandingsByRound([record, record, field]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.roundCode, "SBG");
    assert.equal(groups[0]?.records.length, 2);
    assert.equal(groups[1]?.roundCode, "FIELD");
  });
});
