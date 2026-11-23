import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chooseCurrentRecords, type HeldRecord } from "./current.ts";

function held(overrides: Partial<HeldRecord> & Pick<HeldRecord, "score" | "scoreId">): HeldRecord {
  return {
    bowCode: "BB-R",
    roundCode: "FIELD",
    ageCode: "A",
    gender: "female",
    achievedOn: new Date("2024-06-01T00:00:00.000Z"),
    recognisedAt: new Date("2024-06-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("chooseCurrentRecords", () => {
  it("keeps the highest score when a later score breaks the record", () => {
    const [current] = chooseCurrentRecords([
      held({ score: 400, scoreId: "earlier", achievedOn: new Date("2023-01-01T00:00:00.000Z") }),
      held({ score: 450, scoreId: "later", achievedOn: new Date("2025-01-01T00:00:00.000Z") }),
    ]);
    assert.equal(current?.scoreId, "later");
  });

  it("keeps the earlier holder when the scores are equal", () => {
    const [current] = chooseCurrentRecords([
      held({ score: 500, scoreId: "later", achievedOn: new Date("2025-01-01T00:00:00.000Z") }),
      held({ score: 500, scoreId: "earlier", achievedOn: new Date("2023-01-01T00:00:00.000Z") }),
    ]);
    assert.equal(current?.scoreId, "earlier");
  });

  it("does not let an undated tie replace a dated holder", () => {
    const [current] = chooseCurrentRecords([
      held({ score: 500, scoreId: "dated" }),
      held({ score: 500, scoreId: "undated", achievedOn: null }),
    ]);
    assert.equal(current?.scoreId, "dated");
  });

  it("keeps a separate holder for each bow style", () => {
    const current = chooseCurrentRecords([
      held({ score: 100, scoreId: "recurve", bowCode: "BH-R" }),
      held({ score: 400, scoreId: "longbow", bowCode: "LB" }),
    ]);
    assert.deepEqual(
      current.map((record) => record.scoreId).sort(),
      ["longbow", "recurve"],
    );
  });

  it("keeps a separate holder for each round, age, and gender", () => {
    const current = chooseCurrentRecords([
      held({ score: 100, scoreId: "field" }),
      held({ score: 200, scoreId: "hunter", roundCode: "HUNTER" }),
      held({ score: 300, scoreId: "veteran", ageCode: "V" }),
      held({ score: 400, scoreId: "male", gender: "male" }),
    ]);
    assert.deepEqual(
      current.map((record) => record.scoreId).sort(),
      ["field", "hunter", "male", "veteran"],
    );
  });
});
