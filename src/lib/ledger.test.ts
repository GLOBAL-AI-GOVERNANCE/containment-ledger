import assert from "node:assert/strict";
import test from "node:test";
import { SEED, decisionText, emptyLedger, review, type LedgerState } from "./ledger.ts";

test("an empty inventory makes no governance claim", () => {
  const result = review(emptyLedger());
  assert.equal(result.canBound, false);
  assert.equal(result.headline, "No inventory, no governance.");
});

test("the synthetic cell stays unbounded while a path is unassessed", () => {
  const result = review(SEED);
  assert.equal(result.canBound, false);
  assert.ok(result.unassessed > 0);
  assert.equal(result.crownExposed, true);
  assert.ok(result.criticalOpen.length > 0);
});

test("bounded disposition requires isolation, a crown, and evidenced critical items", () => {
  const state: LedgerState = {
    systemName: "Closed synthetic pair",
    domains: [
      { id: "user", name: "User work", kind: "user", crown: false },
      { id: "mission", name: "Mission records", kind: "mission", crown: true },
    ],
    paths: { "mission|user": "isolated" },
    evidence: {
      "domains-named": "evidenced",
      "crown-named": "evidenced",
      "admin-user-split": "evidenced",
      "paths-explicit": "evidenced",
      "sharing-minimized": "missing",
      "least-privilege": "partial",
      "least-functionality": "missing",
      "least-persistence": "missing",
      "boundary-logged": "partial",
      "continuous-protection": "evidenced",
    },
    note: "",
    disposition: "bounded",
  };
  const result = review(state);
  assert.equal(result.canBound, true);
  assert.match(decisionText(state, result), /authority_effect: NONE/);
  assert.match(decisionText(state, result), /Not certification/);
});
