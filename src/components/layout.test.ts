import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ledger-app.tsx", import.meta.url), "utf8");

// Grid items default to min-width: auto, so a panel holding a horizontal scroller would
// widen the single mobile column to the scroller's full width and clip the page.
test("panels in two-column grids can shrink to a narrow viewport", () => {
  const grids = [...source.matchAll(/className="[^"]*\bgrid\b[^"]*lg:grid-cols-\[[^"]*"/g)];
  assert.ok(grids.length >= 2, "expected the two-column panel grids");
  for (const grid of grids) {
    const after = source.slice(grid.index! + grid[0].length);
    const panels = [...after.matchAll(/<(?:section|div) className="([^"]*\brounded-card border border-line bg-panel\b[^"]*)"/g)].slice(0, 2);
    assert.equal(panels.length, 2);
    for (const [, classes] of panels) assert.match(classes, /\bmin-w-0\b/, `panel without min-w-0: ${classes}`);
  }
});
