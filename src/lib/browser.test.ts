import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_NOTICE, copyText, nextDomainName, probeStorage } from "./browser.ts";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

test("storage probe is true for a working store and leaves nothing behind", () => {
  const store = memoryStore();
  assert.equal(probeStorage(() => store), true);
  assert.equal(store.data.size, 0);
});

test("storage probe is false when access, writing, or removal is denied", () => {
  assert.equal(probeStorage(() => { throw new DOMException("denied", "SecurityError"); }), false);
  assert.equal(probeStorage(() => null), false);
  assert.equal(
    probeStorage(() => ({ setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} })),
    false,
  );
  assert.equal(
    probeStorage(() => ({ setItem: () => {}, removeItem: () => { throw new Error("denied"); } })),
    false,
  );
});

test("memory-only notice never claims the record is saved", () => {
  assert.doesNotMatch(STORAGE_NOTICE.memoryOnly, /^Saved/);
  assert.match(STORAGE_NOTICE.memoryOnly, /Not saved/);
  assert.match(STORAGE_NOTICE.memoryOnly, /lost on reload/);
});

test("copy reports success and failure instead of failing silently", async () => {
  let written = "";
  assert.equal(await copyText({ writeText: async (t) => { written = t; } }, "record"), "copied");
  assert.equal(written, "record");
  assert.equal(await copyText({ writeText: async () => { throw new DOMException("denied", "NotAllowedError"); } }, "x"), "failed");
  assert.equal(await copyText(undefined, "x"), "failed");
});

test("new domains get distinct default names", () => {
  const domains: { name: string }[] = [];
  for (let i = 0; i < 4; i += 1) domains.push({ name: nextDomainName(domains) });
  assert.deepEqual(domains.map((d) => d.name), ["New domain", "New domain 2", "New domain 3", "New domain 4"]);
  assert.equal(nextDomainName([{ name: "New domain 2" }]), "New domain");
  assert.equal(nextDomainName([{ name: "new domain" }, { name: "New domain 2" }]), "New domain 3");
});
