import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIssuedPins } from "./tracker.ts";

describe("parseIssuedPins", () => {
  it("treats capitals as pins and lower case as progress", () => {
    assert.deepEqual(parseIssuedPins("GOLD,g,g"), ["gold"]);
    assert.deepEqual(parseIssuedPins("b"), []);
    assert.deepEqual(parseIssuedPins("BRONZE,SILVER,GOLD,HOTSHOT,STAR"), [
      "bronze",
      "silver",
      "gold",
      "hotshot",
      "star",
    ]);
  });

  it("strips extra-score counts and period separators", () => {
    assert.deepEqual(parseIssuedPins("(2xb)BRONZE,s"), ["bronze"]);
    assert.deepEqual(parseIssuedPins("s.GOLD,HOTSHOT,STAR"), ["gold", "hotshot", "star"]);
    assert.deepEqual(parseIssuedPins("GOLD,g,g,g,g.g"), ["gold"]);
    assert.deepEqual(parseIssuedPins("BRONZE,SILVER,GOLD,HOTSHOT.STAR"), [
      "bronze",
      "silver",
      "gold",
      "hotshot",
      "star",
    ]);
  });
});
