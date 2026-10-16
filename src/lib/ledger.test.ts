import assert from "node:assert/strict";
import test from "node:test";
import {
  SEED,
  decisionText,
  emptyLedger,
  reconcile,
  review,
  sanitize,
  type LedgerState,
} from "./ledger.ts";

const evidenced = {
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
} as const;

function bounded(): LedgerState {
  return {
    systemName: "Closed synthetic pair",
    domains: [
      { id: "user", name: "User work", kind: "user", crown: false },
      { id: "mission", name: "Mission records", kind: "mission", crown: true },
    ],
    paths: { "mission|user": "isolated" },
    evidence: { ...evidenced },
    note: "",
    disposition: "bounded",
    boundedInvalidated: false,
  };
}

function exported(state: LedgerState): string {
  return decisionText(state, review(state));
}

test("an empty inventory makes no governance claim", () => {
  const result = review(emptyLedger());
  assert.equal(result.canBound, false);
  assert.equal(result.headline, "No inventory, no governance.");
  assert.equal(emptyLedger().boundedInvalidated, false);
});

test("the synthetic cell stays unbounded while a path is unassessed", () => {
  const result = review(SEED);
  assert.equal(result.canBound, false);
  assert.ok(result.unassessed > 0);
  assert.equal(result.crownExposed, true);
  assert.ok(result.criticalOpen.length > 0);
});

test("bounded disposition requires isolation, a crown, and evidenced critical items", () => {
  const state = bounded();
  const result = review(state);
  assert.equal(result.canBound, true);
  assert.match(exported(state), /Current human disposition: bounded/);
  assert.match(exported(state), /authority_effect: NONE/);
  assert.match(exported(state), /Not certification/);
  assert.match(exported(state), /not independent verification/);
});

test("an isolated path changed to unassessed invalidates a bounded selection", () => {
  const next = reconcile({ ...bounded(), paths: { "mission|user": "unassessed" } });
  assert.equal(next.disposition, "gaps");
  assert.equal(next.boundedInvalidated, true);
  assert.doesNotMatch(exported(next), /Current human disposition: bounded/);
  assert.match(exported(next), /Prior bounded selection: invalidated/);
});

test("an implicit path to a crown jewel invalidates a bounded selection", () => {
  const next = reconcile({ ...bounded(), paths: { "mission|user": "implicit" } });
  assert.equal(review(next).crownExposed, true);
  assert.equal(next.disposition, "gaps");
  assert.match(exported(next), /invalidated/);
});

test("downgrading a critical evidence mark invalidates a bounded selection", () => {
  const next = reconcile({
    ...bounded(),
    evidence: { ...evidenced, "continuous-protection": "partial" },
  });
  assert.equal(next.disposition, "gaps");
  assert.equal(next.boundedInvalidated, true);
});

test("removing the crown jewel invalidates a bounded selection", () => {
  const next = reconcile({
    ...bounded(),
    domains: bounded().domains.map((d) => ({ ...d, crown: false })),
  });
  assert.equal(next.disposition, "gaps");
  assert.equal(next.boundedInvalidated, true);
});

test("adding a domain invalidates a bounded selection until the new path is assessed", () => {
  const next = reconcile({
    ...bounded(),
    domains: [...bounded().domains, { id: "extra", name: "Extra", kind: "data", crown: false }],
  });
  assert.ok(review(next).unassessed > 0);
  assert.equal(next.disposition, "gaps");
});

test("removing a domain so fewer than two remain invalidates a bounded selection", () => {
  const next = reconcile({
    ...bounded(),
    domains: bounded().domains.filter((d) => d.id === "mission"),
    paths: {},
  });
  assert.equal(next.disposition, "gaps");
  assert.equal(next.boundedInvalidated, true);
});

test("a stored bounded record that no longer qualifies loads as invalidated", () => {
  const loaded = sanitize({ ...bounded(), paths: { "mission|user": "unassessed" } });
  assert.equal(loaded.disposition, "gaps");
  assert.equal(loaded.boundedInvalidated, true);
  assert.doesNotMatch(exported(loaded), /Current human disposition: bounded/);
});

test("a still-valid bounded record stays bounded when loaded", () => {
  const loaded = sanitize(bounded());
  assert.equal(loaded.disposition, "bounded");
  assert.equal(loaded.boundedInvalidated, false);
  assert.match(exported(loaded), /Current human disposition: bounded/);
});

test("clearing an assessment drops any bounded conclusion", () => {
  const cleared = emptyLedger();
  assert.equal(cleared.disposition, "incomplete");
  assert.equal(cleared.boundedInvalidated, false);
  assert.doesNotMatch(exported(cleared), /Current human disposition: bounded/);
});
