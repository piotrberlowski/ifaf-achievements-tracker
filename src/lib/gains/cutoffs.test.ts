import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gainsCutoffs, scoreCutoff } from "./cutoffs.ts";

describe("scoreCutoff", () => {
  it("rounds a fractional percent up to the next whole score", () => {
    assert.equal(scoreCutoff(206, 90), 186);
    assert.equal(scoreCutoff(412, 80), 330);
    assert.equal(scoreCutoff(101, 50), 51);
  });

  it("keeps a percent that lands on a whole score", () => {
    assert.equal(scoreCutoff(560, 50), 280);
    assert.equal(scoreCutoff(560, 70), 392);
    assert.equal(scoreCutoff(560, 80), 448);
    assert.equal(scoreCutoff(560, 90), 504);
    assert.equal(scoreCutoff(0, 90), 0);
  });

  it("rejects a score or percent that is not a whole number in range", () => {
    assert.throws(() => scoreCutoff(1.5, 50), /whole number/);
    assert.throws(() => scoreCutoff(-1, 50), /whole number/);
    assert.throws(() => scoreCutoff(100, 90.5), /percent/);
  });
});

describe("gainsCutoffs", () => {
  it("sets Bronze, Silver, Gold, and Star from one record", () => {
    assert.deepEqual(gainsCutoffs(200), {
      bronze: 100,
      silver: 140,
      gold: 160,
      star: 180,
    });
  });
});
