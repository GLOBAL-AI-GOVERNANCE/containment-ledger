export type DomainKind = "user" | "admin" | "mission" | "data" | "recovery" | "shared";

export type PathStatus = "unassessed" | "isolated" | "mediated" | "implicit";

export type Evidence = "missing" | "partial" | "evidenced";

export type Disposition = "incomplete" | "gaps" | "bounded";

export type Domain = {
  id: string;
  name: string;
  kind: DomainKind;
  crown: boolean;
};

export type LedgerState = {
  systemName: string;
  domains: Domain[];
  paths: Record<string, PathStatus>;
  evidence: Record<string, Evidence>;
  note: string;
  disposition: Disposition;
};

export type CheckItem = {
  id: string;
  label: string;
  critical: boolean;
};

export const CHECKS: CheckItem[] = [
  { id: "domains-named", label: "Mission domains are named, not implied.", critical: false },
  { id: "crown-named", label: "At least one crown-jewel domain is identified.", critical: false },
  { id: "admin-user-split", label: "Admin authority is separated from user work.", critical: true },
  { id: "paths-explicit", label: "Every domain pair is isolated, mediated, or recorded as implicit.", critical: true },
  { id: "sharing-minimized", label: "Shared services are few and named.", critical: false },
  { id: "least-privilege", label: "Service accounts hold only the rights the function needs.", critical: false },
  { id: "least-functionality", label: "Unneeded services are disabled inside each domain.", critical: false },
  { id: "least-persistence", label: "Long-lived footholds are removed when the function ends.", critical: false },
  { id: "boundary-logged", label: "Authorized boundary crossings are logged.", critical: false },
  { id: "continuous-protection", label: "Boundaries hold during update, backup, and recovery.", critical: true },
];

export const PHASES = [
  {
    id: 1,
    name: "Initial access",
    principle: "Least functionality",
    effect: "A smaller exposed surface makes an unexpected probe easier to notice.",
    limit: "Intended effect only. It does not prove the entry point is closed.",
  },
  {
    id: 2,
    name: "Foothold",
    principle: "Continuous protection",
    effect: "A boundary that stays up during startup and recovery leaves fewer quiet windows.",
    limit: "Intended effect only. It does not prove a callback is blocked.",
  },
  {
    id: 3,
    name: "Discovery",
    principle: "Least sharing",
    effect: "What is not shared cannot be enumerated from the compromised domain.",
    limit: "Intended effect only. Hidden shares can still exist if they were not recorded.",
  },
  {
    id: 4,
    name: "Lateral movement",
    principle: "Domain separation and mediated access",
    effect: "Movement across domains must use a named, authorized interface.",
    limit: "Intended effect only. An unassessed path is not isolation.",
  },
  {
    id: 5,
    name: "Privilege rise",
    principle: "Least privilege",
    effect: "Rights gathered in one domain do not operate in another.",
    limit: "Intended effect only. It is not proof that credentials were tested.",
  },
  {
    id: 6,
    name: "Persistence",
    principle: "Least persistence",
    effect: "A function that is not present, reachable, and active cannot be reused later.",
    limit: "Intended effect only. It does not inventory every foothold.",
  },
  {
    id: 7,
    name: "Mission effect",
    principle: "Containment",
    effect: "Damage stays inside the domain that was actually reached.",
    limit: "Intended effect only. This review does not authorize operations or certify resilience.",
  },
] as const;

export const KIND_LABEL: Record<DomainKind, string> = {
  user: "User",
  admin: "Admin",
  mission: "Mission",
  data: "Data",
  recovery: "Recovery",
  shared: "Shared",
};

const PATHS: PathStatus[] = ["unassessed", "isolated", "mediated", "implicit"];
const EVIDENCE: Evidence[] = ["missing", "partial", "evidenced"];
const KINDS: DomainKind[] = ["user", "admin", "mission", "data", "recovery", "shared"];

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function pairs(domains: Domain[]): [Domain, Domain][] {
  const out: [Domain, Domain][] = [];
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) out.push([domains[i], domains[j]]);
  }
  return out;
}

function blankEvidence(): Record<string, Evidence> {
  return Object.fromEntries(CHECKS.map((c) => [c.id, "missing" as Evidence]));
}

export const SEED: LedgerState = {
  systemName: "Synthetic mission records cell",
  domains: [
    { id: "user", name: "User workstations", kind: "user", crown: false },
    { id: "share", name: "Shared file service", kind: "shared", crown: false },
    { id: "admin", name: "Admin jump", kind: "admin", crown: false },
    { id: "mission", name: "Mission records", kind: "mission", crown: true },
    { id: "recover", name: "Recovery vault", kind: "recovery", crown: false },
  ],
  paths: {
    "share|user": "implicit",
    "admin|share": "implicit",
    "admin|mission": "mediated",
    "admin|user": "isolated",
    "mission|user": "isolated",
    "recover|user": "isolated",
    "mission|share": "unassessed",
    "recover|share": "isolated",
    "admin|recover": "mediated",
    "mission|recover": "isolated",
  },
  evidence: {
    "domains-named": "evidenced",
    "crown-named": "evidenced",
    "admin-user-split": "partial",
    "paths-explicit": "partial",
    "sharing-minimized": "missing",
    "least-privilege": "partial",
    "least-functionality": "missing",
    "least-persistence": "missing",
    "boundary-logged": "partial",
    "continuous-protection": "missing",
  },
  note: "",
  disposition: "incomplete",
};

export function emptyLedger(): LedgerState {
  return {
    systemName: "Unnamed system",
    domains: [],
    paths: {},
    evidence: blankEvidence(),
    note: "",
    disposition: "incomplete",
  };
}

function isKind(v: unknown): v is DomainKind {
  return typeof v === "string" && KINDS.includes(v as DomainKind);
}

export function sanitize(raw: unknown): LedgerState {
  if (!raw || typeof raw !== "object") return SEED;
  const r = raw as Partial<LedgerState>;
  const domains: Domain[] = Array.isArray(r.domains)
    ? r.domains
        .filter((d): d is Domain => !!d && typeof d === "object")
        .map((d) => ({
          id: typeof d.id === "string" && d.id ? d.id : cryptoId(),
          name: typeof d.name === "string" && d.name.trim() ? d.name.slice(0, 80) : "Domain",
          kind: isKind(d.kind) ? d.kind : "user",
          crown: Boolean(d.crown),
        }))
        .slice(0, 8)
    : [];
  const ids = new Set(domains.map((d) => d.id));
  const paths: Record<string, PathStatus> = {};
  if (r.paths && typeof r.paths === "object") {
    for (const [k, v] of Object.entries(r.paths)) {
      const [a, b] = k.split("|");
      if (a && b && ids.has(a) && ids.has(b) && PATHS.includes(v as PathStatus)) {
        paths[pairKey(a, b)] = v as PathStatus;
      }
    }
  }
  const evidence = blankEvidence();
  if (r.evidence && typeof r.evidence === "object") {
    for (const c of CHECKS) {
      const v = (r.evidence as Record<string, unknown>)[c.id];
      if (EVIDENCE.includes(v as Evidence)) evidence[c.id] = v as Evidence;
    }
  }
  const disposition: Disposition =
    r.disposition === "gaps" || r.disposition === "bounded" || r.disposition === "incomplete"
      ? r.disposition
      : "incomplete";
  return {
    systemName: typeof r.systemName === "string" && r.systemName.trim() ? r.systemName.slice(0, 80) : "Unnamed system",
    domains,
    paths,
    evidence,
    note: typeof r.note === "string" ? r.note.slice(0, 600) : "",
    disposition,
  };
}

export function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type Review = {
  pairCount: number;
  unassessed: number;
  implicit: number;
  mediated: number;
  isolated: number;
  crownExposed: boolean;
  criticalOpen: string[];
  evidenced: number;
  partial: number;
  missing: number;
  canBound: boolean;
  headline: string;
};

export function review(state: LedgerState): Review {
  const list = pairs(state.domains);
  let unassessed = 0;
  let implicit = 0;
  let mediated = 0;
  let isolated = 0;
  let crownExposed = false;
  for (const [a, b] of list) {
    const status = state.paths[pairKey(a.id, b.id)] ?? "unassessed";
    if (status === "unassessed") unassessed += 1;
    if (status === "implicit") implicit += 1;
    if (status === "mediated") mediated += 1;
    if (status === "isolated") isolated += 1;
    if ((a.crown || b.crown) && (status === "implicit" || status === "unassessed")) crownExposed = true;
  }
  const criticalOpen = CHECKS.filter((c) => c.critical && state.evidence[c.id] !== "evidenced").map((c) => c.label);
  let evidenced = 0;
  let partial = 0;
  let missing = 0;
  for (const c of CHECKS) {
    const v = state.evidence[c.id] ?? "missing";
    if (v === "evidenced") evidenced += 1;
    else if (v === "partial") partial += 1;
    else missing += 1;
  }
  const hasCrown = state.domains.some((d) => d.crown);
  const canBound =
    state.domains.length >= 2 &&
    hasCrown &&
    unassessed === 0 &&
    !crownExposed &&
    criticalOpen.length === 0;
  let headline = "No inventory, no governance.";
  if (state.domains.length === 0) headline = "No inventory, no governance.";
  else if (!hasCrown) headline = "Name the crown jewel before any claim.";
  else if (unassessed > 0) headline = "Unassessed paths are not isolation.";
  else if (crownExposed) headline = "An implicit path still reaches a crown domain.";
  else if (criticalOpen.length > 0) headline = "A critical isolation or recovery gap stays visible.";
  else headline = "The record supports a bounded review. It is not authorization.";
  return {
    pairCount: list.length,
    unassessed,
    implicit,
    mediated,
    isolated,
    crownExposed,
    criticalOpen,
    evidenced,
    partial,
    missing,
    canBound,
    headline,
  };
}

export function decisionText(state: LedgerState, result: Review): string {
  const lines = [
    `Containment Ledger — decision record`,
    `System: ${state.systemName}`,
    `Headline: ${result.headline}`,
    `Domains: ${state.domains.map((d) => `${d.name}${d.crown ? " (crown)" : ""}`).join("; ") || "none"}`,
    `Paths: ${result.isolated} isolated, ${result.mediated} mediated, ${result.implicit} implicit, ${result.unassessed} unassessed`,
    `Evidence: ${result.evidenced} evidenced, ${result.partial} partial, ${result.missing} missing`,
    `Critical gaps: ${result.criticalOpen.length ? result.criticalOpen.join(" | ") : "none recorded"}`,
    `Human disposition: ${state.disposition}`,
    state.note ? `Note: ${state.note}` : "Note: none",
    `authority_effect: NONE`,
    `Limit: synthetic structural review. Not certification, compliance, production authorization, or proof of deployed resilience.`,
  ];
  return lines.join("\n");
}
