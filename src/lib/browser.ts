// Browser capability helpers. Pure functions so they can be tested without a DOM.

export type StorageLike = Pick<Storage, "setItem" | "removeItem">;
export type ClipboardLike = { writeText(text: string): Promise<void> };

export const STORAGE_PROBE_KEY = "containment-ledger-probe";

/** True only when a value can actually be written and removed. A denied or full store is false. */
export function probeStorage(getStore: () => StorageLike | null | undefined): boolean {
  try {
    const store = getStore();
    if (!store) return false;
    store.setItem(STORAGE_PROBE_KEY, "1");
    store.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Resolves "copied" or "failed". It never throws, so a denied clipboard cannot fail silently. */
export async function copyText(
  clipboard: ClipboardLike | null | undefined,
  text: string,
): Promise<"copied" | "failed"> {
  try {
    if (!clipboard || typeof clipboard.writeText !== "function") return "failed";
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** A default name no other domain uses, so every control has a distinct accessible name. */
export function nextDomainName(domains: ReadonlyArray<{ name: string }>): string {
  const used = new Set(domains.map((d) => d.name.trim().toLowerCase()));
  if (!used.has("new domain")) return "New domain";
  for (let n = 2; ; n += 1) {
    const candidate = `New domain ${n}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

export const STORAGE_NOTICE = {
  saved:
    "Saved in this browser only. Nothing is uploaded. Clear saved removes the previous record from this browser.",
  memoryOnly:
    "Not saved: this browser blocks local storage, so this record exists only in memory for this visit and is lost on reload. Nothing is uploaded. Copy the decision record to keep it.",
} as const;

export const CLEAR_CONFIRM =
  "Clear the saved record from this browser and start an empty ledger? This cannot be undone.";
