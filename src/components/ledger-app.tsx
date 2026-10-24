import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  CHECKS,
  KIND_LABEL,
  PHASES,
  SEED,
  type Disposition,
  type DomainKind,
  type Evidence,
  type LedgerState,
  type PathStatus,
  cryptoId,
  decisionText,
  emptyLedger,
  pairKey,
  pairs,
  reconcile,
  review,
  sanitize,
} from "../lib/ledger";
import { CLEAR_CONFIRM, STORAGE_NOTICE, copyText, nextDomainName, probeStorage } from "../lib/browser";

const STORAGE_KEY = "containment-ledger-v1";

const KINDS: DomainKind[] = ["user", "admin", "mission", "data", "recovery", "shared"];
const PATH_ORDER: PathStatus[] = ["implicit", "unassessed", "mediated", "isolated"];

const PATH_LABEL: Record<PathStatus, string> = {
  unassessed: "Unassessed",
  isolated: "Isolated",
  mediated: "Mediated",
  implicit: "Implicit trust",
};

const EVIDENCE_LABEL: Record<Evidence, string> = {
  missing: "Missing",
  partial: "Partial",
  evidenced: "Evidenced",
};

function loadSaved(): LedgerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return sanitize(JSON.parse(raw));
  } catch {
    return SEED;
  }
}

function persist(state: LedgerState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // Storage can be denied or full. The review stays in memory for this visit.
    return false;
  }
}

function forgetSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A denied store cannot be cleared from script. The in-memory record is still reset.
  }
}

export function LedgerApp() {
  const [state, setState] = useState<LedgerState>(SEED);
  const [phase, setPhase] = useState(4);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const manualRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ok = probeStorage(() => window.localStorage);
    setStorageOk(ok);
    setState(ok ? loadSaved() : SEED);
    setReady(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready || !storageOk) return;
    if (!persist(state)) setStorageOk(false);
  }, [state, ready, storageOk]);

  useEffect(() => {
    if (manualCopy === null) return;
    manualRef.current?.focus();
    manualRef.current?.select();
  }, [manualCopy]);

  const result = useMemo(() => review(state), [state]);
  const active = PHASES.find((p) => p.id === phase) ?? PHASES[3];
  const orderedPairs = useMemo(() => {
    const list = pairs(state.domains);
    return list.sort((a, b) => {
      const sa = state.paths[pairKey(a[0].id, a[1].id)] ?? "unassessed";
      const sb = state.paths[pairKey(b[0].id, b[1].id)] ?? "unassessed";
      return PATH_ORDER.indexOf(sa) - PATH_ORDER.indexOf(sb);
    });
  }, [state.domains, state.paths]);

  function commit(recipe: (current: LedgerState) => LedgerState) {
    setState((current) => reconcile(recipe(current)));
  }

  function patch(partial: Partial<LedgerState>) {
    commit((current) => ({ ...current, ...partial }));
  }

  function setPath(a: string, b: string, status: PathStatus) {
    const key = pairKey(a, b);
    commit((current) => ({ ...current, paths: { ...current.paths, [key]: status } }));
  }

  function setEvidence(id: string, value: Evidence) {
    commit((current) => ({ ...current, evidence: { ...current.evidence, [id]: value } }));
  }

  function addDomain() {
    if (state.domains.length >= 8) return;
    const id = cryptoId();
    commit((current) => ({
      ...current,
      domains: [...current.domains, { id, name: nextDomainName(current.domains), kind: "user", crown: false }],
    }));
  }

  function updateDomain(id: string, patchDomain: Partial<(typeof state.domains)[number]>) {
    commit((current) => ({
      ...current,
      domains: current.domains.map((d) => (d.id === id ? { ...d, ...patchDomain } : d)),
    }));
  }

  function removeDomain(id: string) {
    commit((current) => {
      const domains = current.domains.filter((d) => d.id !== id);
      const paths: LedgerState["paths"] = {};
      for (const [k, v] of Object.entries(current.paths)) {
        const [a, b] = k.split("|");
        if (a !== id && b !== id) paths[k] = v;
      }
      return { ...current, domains, paths };
    });
  }

  function setDisposition(disposition: Disposition) {
    setState((current) => {
      if (disposition === "bounded") {
        if (!review(current).canBound) return reconcile(current);
        return { ...current, disposition: "bounded", boundedInvalidated: false };
      }
      return { ...current, disposition };
    });
  }

  function clearSaved() {
    if (!window.confirm(CLEAR_CONFIRM)) return;
    forgetSaved();
    setState(emptyLedger());
  }

  async function copyRecord() {
    const text = decisionText(state, result);
    const outcome = await copyText(typeof navigator === "undefined" ? undefined : navigator.clipboard, text);
    if (outcome === "copied") {
      setManualCopy(null);
      setCopied(true);
      setCopyMessage("Decision record copied to the clipboard.");
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      setCopied(false);
      setCopyMessage("Copy failed: this browser blocked clipboard access. The record is selected below; copy it manually.");
      setManualCopy(text);
    }
  }

  if (!mounted) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
        <p className="font-mono text-xs tracking-widest text-mist uppercase">Global AI Governance</p>
        <h1 className="mt-2 text-3xl font-medium text-bone">Containment Ledger</h1>
        <p className="mt-1 font-mono text-xs tracking-wide text-mist uppercase">Security Boundary Review</p>
        <p className="mt-2 max-w-xl text-sm text-mist">
          AI compresses attack time. Structural security compresses blast radius.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <a
        href="#ledger-content"
        className="sr-only rounded-card bg-bone px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>
      <nav
        aria-label="Global AI Governance sites"
        className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3 text-xs text-mist"
      >
        <a className="font-semibold tracking-widest text-bone uppercase" href="https://ai-governance.solutions/">
          Global AI Governance
        </a>
        <span className="flex flex-1 flex-wrap gap-4">
          <a className="hover:text-bone" href="https://ai-governance.solutions/#toolkit">Toolkit</a>
          <a className="hover:text-bone" href="https://ai-governance.solutions/connect.html">Connect</a>
          <a className="text-bone" href="/containment-ledger/" aria-current="page">Containment Ledger</a>
          <a className="hover:text-bone" href="/peace-os/">Peace OS</a>
        </span>
        <a
          className="rounded-card border border-mist px-3 py-1 font-semibold text-bone hover:border-bone hover:bg-bone hover:text-ink"
          href="https://ai-governance.solutions/connect.html#agents"
        >
          Connect your agent
        </a>
      </nav>
      <header id="ledger-content" tabIndex={-1} className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-mist uppercase">Global AI Governance</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-bone sm:text-4xl">Containment Ledger</h1>
          <p className="mt-1 font-mono text-xs tracking-wide text-mist uppercase">Security Boundary Review</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
            AI compresses attack time. Structural security compresses blast radius. Record the domains, the paths,
            and the evidence — then a person decides. This runs in your browser only. It is not certification, enforcement, independent verification, or an immutable record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setState(SEED)}
            className="inline-flex h-11 items-center gap-2 rounded-card border border-line bg-panel px-3 text-sm text-bone"
          >
            <RotateCcw className="size-4 text-brass" aria-hidden />
            Load example
          </button>
          <button
            type="button"
            onClick={clearSaved}
            className="inline-flex h-11 items-center rounded-card border border-line px-3 text-sm text-mist"
          >
            Clear saved
          </button>
        </div>
      </header>

      <section className="mb-6 rounded-card border border-line bg-panel px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-wide text-mist uppercase">Review finding</p>
            <p className="mt-1 text-lg text-bone">{result.headline}</p>
          </div>
          <p className="font-mono text-xs text-brass">authority_effect: NONE</p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Implicit" value={result.implicit} tone="gap" />
          <Stat label="Unassessed" value={result.unassessed} tone="brass" />
          <Stat label="Mediated" value={result.mediated} tone="bone" />
          <Stat label="Isolated" value={result.isolated} tone="sage" />
        </dl>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className="min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5">
          <label className="block">
            <span className="font-mono text-xs tracking-wide text-mist uppercase">System under review</span>
            <input
              value={state.systemName}
              onChange={(e) => patch({ systemName: e.target.value.slice(0, 80) })}
              className="mt-2 h-11 w-full rounded-card border border-line bg-ink px-3 text-bone outline-none focus:border-brass"
            />
          </label>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-sm font-medium text-bone">Domains</h2>
            <button
              type="button"
              onClick={addDomain}
              disabled={state.domains.length >= 8}
              className="inline-flex h-11 items-center gap-1 rounded-card bg-brass px-3 text-sm font-medium text-ink disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
              Add
            </button>
          </div>

          <ul className="mt-3 space-y-3">
            {state.domains.length === 0 && (
              <li className="rounded-card border border-dashed border-line px-3 py-6 text-sm text-mist">
                Add the domains that must not share fate. A flat list with no boundaries is the finding.
              </li>
            )}
            {state.domains.map((d) => (
              <li key={d.id} className="rounded-card border border-line bg-panel-2 p-3">
                <div className="flex gap-2">
                  <input
                    aria-label={`Name of ${d.name}`}
                    value={d.name}
                    onChange={(e) => updateDomain(d.id, { name: e.target.value.slice(0, 80) })}
                    className="h-11 min-w-0 flex-1 rounded-card border border-line bg-ink px-3 text-sm text-bone outline-none focus:border-brass"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${d.name}`}
                    onClick={() => removeDomain(d.id)}
                    className="inline-flex size-11 items-center justify-center rounded-card border border-line text-mist"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Kind of ${d.name}`}
                    value={d.kind}
                    onChange={(e) => updateDomain(d.id, { kind: e.target.value as DomainKind })}
                    className="h-11 rounded-card border border-line bg-ink px-2 text-sm text-bone"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex h-11 items-center gap-2 rounded-card border border-line px-3 text-sm text-bone">
                    <input
                      type="checkbox"
                      checked={d.crown}
                      onChange={(e) => updateDomain(d.id, { crown: e.target.checked })}
                      className="size-4 accent-brass"
                    />
                    Crown jewel
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5">
          <h2 className="text-sm font-medium text-bone">Recorded paths</h2>
          <p className="mt-1 text-sm text-mist">
            A missing line is not isolation. Mark every pair. Implicit trust is how one foothold becomes mission loss.
          </p>
          <BoundaryMap state={state} />
          <ul className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
            {orderedPairs.length === 0 && (
              <li className="text-sm text-mist">Two domains are required before a path can exist.</li>
            )}
            {orderedPairs.map(([a, b]) => {
              const status = state.paths[pairKey(a.id, b.id)] ?? "unassessed";
              return (
                <li key={pairKey(a.id, b.id)} className="rounded-card border border-line bg-ink p-3">
                  <p className="text-sm text-bone">
                    {a.name}
                    {a.crown ? " · crown" : ""} <span className="text-mist">to</span> {b.name}
                    {b.crown ? " · crown" : ""}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(PATH_LABEL) as PathStatus[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={status === opt}
                        onClick={() => setPath(a.id, b.id, opt)}
                        className={
                          "h-11 rounded-card border px-2 text-xs " +
                          (status === opt ? "font-semibold " : "hover:border-mist hover:text-bone ") +
                          (status === opt
                            ? opt === "implicit"
                              ? "border-gap bg-gap text-ink"
                              : opt === "isolated"
                                ? "border-sage bg-sage text-ink"
                                : opt === "mediated"
                                  ? "border-brass bg-brass text-ink"
                                  : "border-bone bg-bone text-ink"
                            : "border-line text-mist")
                        }
                      >
                        {PATH_LABEL[opt]}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5">
          <h2 className="text-sm font-medium text-bone">Where structure is supposed to matter</h2>
          <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={
                  "h-11 shrink-0 rounded-card border px-3 text-sm " +
                  (phase === p.id ? "border-brass bg-brass text-ink" : "border-line text-mist")
                }
              >
                {p.id}. {p.name}
              </button>
            ))}
          </div>
          <article className="mt-4 rounded-card border border-line bg-ink p-4">
            <p className="font-mono text-xs tracking-wide text-brass uppercase">{active.principle}</p>
            <p className="mt-2 text-bone">{active.effect}</p>
            <p className="mt-3 text-sm text-mist">{active.limit}</p>
          </article>
        </div>

        <div className="min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5">
          <h2 className="text-sm font-medium text-bone">Evidence</h2>
          <p className="mt-1 text-sm text-mist">
            These marks are self-reported. They are not an independent check. Missing cannot read as strong.{" "}
            {result.evidenced} evidenced · {result.partial} partial · {result.missing} missing.
          </p>
          <ul className="mt-3 space-y-3">
            {CHECKS.map((c) => {
              const value = state.evidence[c.id] ?? "missing";
              return (
                <li key={c.id} className="rounded-card border border-line bg-ink p-3">
                  <p className="text-sm text-bone">
                    {c.label}
                    {c.critical ? <span className="ml-2 font-mono text-xs text-gap">critical</span> : null}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(Object.keys(EVIDENCE_LABEL) as Evidence[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={value === opt}
                        onClick={() => setEvidence(c.id, opt)}
                        className={
                          "h-11 rounded-card border text-xs " +
                          (value === opt ? "font-semibold " : "hover:border-mist hover:text-bone ") +
                          (value === opt
                            ? opt === "evidenced"
                              ? "border-sage bg-sage text-ink"
                              : opt === "partial"
                                ? "border-brass bg-brass text-ink"
                                : "border-gap bg-gap text-ink"
                            : "border-line text-mist")
                        }
                      >
                        {EVIDENCE_LABEL[opt]}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-card border border-line bg-panel p-4 sm:p-5">
        <h2 className="text-sm font-medium text-bone">Human decision</h2>
        <p className="mt-1 max-w-2xl text-sm text-mist">
          The ledger does not close the review. A person does. A bounded reading is available only when every path is
          assessed, no implicit path reaches a crown domain, and the three critical items are evidenced.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <DecisionButton
            active={state.disposition === "incomplete"}
            onClick={() => setDisposition("incomplete")}
            title="Review incomplete"
            detail="Keep working the map."
          />
          <DecisionButton
            active={state.disposition === "gaps"}
            onClick={() => setDisposition("gaps")}
            title="Gaps recorded"
            detail="Do not claim resilience."
          />
          <DecisionButton
            active={state.disposition === "bounded"}
            disabled={!result.canBound}
            onClick={() => setDisposition("bounded")}
            title="Bounded on this record"
            detail={result.canBound ? "Still not authorization." : "Blocked until critical gaps close."}
          />
        </div>
        <label className="mt-4 block">
          <span className="font-mono text-xs tracking-wide text-mist uppercase">Reviewer note</span>
          <textarea
            value={state.note}
            onChange={(e) => patch({ note: e.target.value.slice(0, 600) })}
            rows={3}
            className="mt-2 w-full rounded-card border border-line bg-ink px-3 py-2 text-sm text-bone outline-none focus:border-brass"
            placeholder="What a person still has to judge."
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyRecord}
            className="inline-flex h-11 items-center gap-2 rounded-card bg-bone px-4 text-sm font-medium text-ink"
          >
            <Copy className="size-4" aria-hidden />
            {copied ? "Copied" : "Copy decision record"}
          </button>
          <p className="text-xs text-mist" role="status" data-storage={storageOk ? "saved" : "memory-only"}>
            {storageOk ? STORAGE_NOTICE.saved : <span className="text-bone">{STORAGE_NOTICE.memoryOnly}</span>}
            {state.boundedInvalidated ? " A prior bounded selection was invalidated." : ""}
          </p>
        </div>
        <p className="mt-2 text-xs text-bone" role="status" aria-live="polite" id="copy-status">
          {copyMessage}
        </p>
        {manualCopy !== null && (
          <div className="mt-2">
            <label htmlFor="manual-copy" className="font-mono text-xs tracking-wide text-mist uppercase">
              Decision record (select and copy)
            </label>
            <textarea
              id="manual-copy"
              ref={manualRef}
              readOnly
              value={manualCopy}
              rows={8}
              aria-describedby="copy-status"
              className="mt-2 w-full rounded-card border border-brass bg-ink px-3 py-2 font-mono text-xs text-bone"
            />
            <button
              type="button"
              onClick={() => {
                setManualCopy(null);
                setCopyMessage("");
              }}
              className="mt-2 inline-flex h-11 items-center rounded-card border border-line px-3 text-sm text-mist"
            >
              Close
            </button>
          </div>
        )}
      </section>

      <footer className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-mist">
        Defensive architecture review only. Not certification, compliance determination, production authorization, or
        proof of deployed resilience. Anchored to the public structural-security ideas in NIST SP 800-160 domain
        separation and the{" "}
        <a
          className="text-brass underline decoration-line underline-offset-2"
          href="https://github.com/GLOBAL-AI-GOVERNANCE/ai-cyber-resilience-framework"
        >
          AI Cyber Resilience Framework
        </a>
        . Ten checks here are a simplified interface. They do not replace that framework's 20-item checklist. The
        record stays in this browser. AI may assist. Humans retain authority.
        <p className="mt-3 font-semibold text-bone">
          <a className="text-brass underline decoration-line underline-offset-2" href="https://ai-governance.solutions/connect.html#agents">Connect your agent</a>
          {" · "}
          <a className="text-brass underline decoration-line underline-offset-2" href="https://ai-governance.solutions/connect.html#spec">Read the spec</a>
        </p>
        <p className="mt-1">
          Global AI Governance · Outputs are non-authorizing (<code>authority_effect: NONE</code>) · Compatible with MCP-based agents
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "gap" | "brass" | "bone" | "sage" }) {
  const color =
    tone === "gap" ? "text-gap" : tone === "brass" ? "text-brass" : tone === "sage" ? "text-sage" : "text-bone";
  return (
    <div className="rounded-card border border-line bg-ink px-3 py-2">
      <dt className="font-mono text-xs text-mist uppercase">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl ${color}`}>{value}</dd>
    </div>
  );
}

function DecisionButton({
  active,
  disabled,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={
        "min-h-11 rounded-card border px-3 py-3 text-left disabled:opacity-40 " +
        (active ? "border-brass bg-ink" : "border-line")
      }
    >
      <span className="block text-sm text-bone">{title}</span>
      <span className="mt-1 block text-xs text-mist">{detail}</span>
    </button>
  );
}

function BoundaryMap({ state }: { state: LedgerState }) {
  const n = state.domains.length;
  const w = 640;
  const h = 220;
  if (n === 0) {
    return (
      <div className="mt-4 flex h-40 items-center justify-center rounded-card border border-dashed border-line text-sm text-mist">
        The map appears when domains exist.
      </div>
    );
  }
  const nodes = state.domains.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const cx = w / 2 + Math.cos(angle) * 230;
    const cy = h / 2 + Math.sin(angle) * 72;
    return { ...d, cx, cy };
  });
  const byId = Object.fromEntries(nodes.map((n0) => [n0.id, n0]));
  const lines = pairs(state.domains).map(([a, b]) => ({
    a: byId[a.id],
    b: byId[b.id],
    status: state.paths[pairKey(a.id, b.id)] ?? "unassessed",
  }));

  return (
    <div className="mt-4 w-full min-w-0 overflow-x-auto rounded-card border border-line bg-ink">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Domain boundary map">
        {lines.map((line) => {
          if (line.status === "isolated") return null;
          const stroke = line.status === "implicit" ? "var(--color-gap)" : line.status === "mediated" ? "var(--color-brass)" : "var(--color-mist)";
          const dash = line.status === "mediated" ? "5 4" : line.status === "unassessed" ? "2 4" : undefined;
          return (
            <line
              key={pairKey(line.a.id, line.b.id)}
              x1={line.a.cx}
              y1={line.a.cy}
              x2={line.b.cx}
              y2={line.b.cy}
              stroke={stroke}
              strokeWidth={line.status === "implicit" ? 2.5 : 1.5}
              strokeDasharray={dash}
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.crown ? 18 : 12}
              fill="var(--color-panel)"
              stroke={node.crown ? "var(--color-brass)" : "var(--color-bone)"}
              strokeWidth={node.crown ? 2 : 1}
            />
            <text x={node.cx} y={node.cy + 32} textAnchor="middle" fill="var(--color-bone)" fontSize="11" fontFamily="IBM Plex Sans, sans-serif">
              {node.name.length > 22 ? `${node.name.slice(0, 20)}…` : node.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
