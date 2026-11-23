import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanArcherName, namesMatch, unmatchedMembershipNumber } from "./names.ts";

describe("cleanArcherName", () => {
  it("moves RIP and quoted nicknames into the note", () => {
    assert.deepEqual(cleanArcherName('Bannon Noel "LEGEND"'), {
      fullName: "Bannon Noel",
      note: "LEGEND",
      tokens: ["bannon", "noel"],
    });
    assert.equal(cleanArcherName("Bannon Patricia RIP").note, "RIP");
    assert.equal(cleanArcherName("Moylan Martin R.I.P.").fullName, "Moylan Martin");
  });
});

describe("namesMatch", () => {
  it("matches surname-first and given-first forms", () => {
    assert.equal(namesMatch("Gilmore Peter", "Peter Gilmore"), true);
    assert.equal(namesMatch("Dempsey David", "David Dempsey"), true);
    assert.equal(namesMatch("Dempsey Una", "Dempsey David"), false);
  });
});

describe("unmatchedMembershipNumber", () => {
  it("is stable for either name order", () => {
    assert.equal(
      unmatchedMembershipNumber("Peter Gilmore"),
      unmatchedMembershipNumber("Gilmore Peter"),
    );
    assert.match(unmatchedMembershipNumber("Peter Gilmore"), /^EXT_/);
  });
});
