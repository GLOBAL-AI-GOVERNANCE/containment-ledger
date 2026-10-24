# Containment Ledger

**Security Boundary Review**

<!-- gaig:nav -->
[![Global AI Governance](https://img.shields.io/badge/Global_AI_Governance-portfolio-0b100d)](https://github.com/GLOBAL-AI-GOVERNANCE/GLOBAL-AI-GOVERNANCE) ![Status](https://img.shields.io/badge/status-unreleased_instrument-lightgrey) ![authority_effect](https://img.shields.io/badge/authority__effect-NONE-lightgrey)

**[Connect your agent](https://global-ai-governance.github.io/global-ai-governance-toolkit/connect.html#agents)** · **[Read the spec](https://global-ai-governance.github.io/global-ai-governance-toolkit/connect.html#spec)** · [All products](https://github.com/GLOBAL-AI-GOVERNANCE/GLOBAL-AI-GOVERNANCE#product-map)
<!-- /gaig:nav -->

A local, browser-based review of one system's security domains, the boundary paths between them, evidence marks, and a human disposition.

**[Open the Ledger](https://global-ai-governance.github.io/containment-ledger/)** · runs locally in your browser. It is a structural review aid, not a certified security control or a security assessment.

Name the domains. Mark every path. Record evidence. A person decides.

Containment Ledger is an independent repository. It shares vocabulary with the [AI Cyber Resilience Framework](https://github.com/GLOBAL-AI-GOVERNANCE/ai-cyber-resilience-framework) but is not part of it, does not replace its documentation, and is not part of the framework's published v0.1.1 release.

## What a review does

1. Name the system and its domains. Mark the crown jewel.
2. Mark every pair as isolated, mediated, implicit trust, or unassessed.
3. Record whether each structural check is missing, partial, or self-reported as evidenced.
4. Read the phase notes as intended architectural effects, not measured outcomes.
5. Choose a human disposition and copy the decision record.

Unassessed is not isolation. A missing critical item cannot read as strong. "Bounded on this record" stays unavailable until those gaps close. If the record later stops qualifying, a previous bounded selection is invalidated and is not copied as the current conclusion.

The ten checks in this instrument are a simplified interface. They do not replace or claim parity with the 20-item qualitative checklist in the AI Cyber Resilience Framework.

## What stays on this machine

System names, domains, paths, evidence marks, and notes are stored in this browser only. Clear saved removes the previous record from this browser. The copy action uses the local clipboard. The page does not upload the review and does not load remote fonts.

Evidence marks are self-reported until an independent check exists. A self-reported mark is not verification.

## What a review does not do

- It is not certification, compliance, or production authorization.
- It is not proof that a live boundary blocks movement.
- It does not measure attacker cost.
- It does not transmit the record. The copy stays on this machine.
- It does not enforce, monitor, or test any boundary. Nothing here contains a live system.
- It is not an immutable, tamper-evident, or cryptographically signed ledger. The saved record is ordinary browser storage and the copied record is plain text that anyone can edit.
- It does not independently verify evidence. "Evidenced" means self-reported.
- `authority_effect: NONE`. A human retains the decision.

## Current limitations

- Paths are recorded per domain pair, not per direction. A one-way mediated flow and its reverse cannot be distinguished.
- Evidence marks are three levels (missing, partial, self-reported evidenced) with no attached artifacts, links, or reviewer identity.
- A record has no hash, signature, timestamp, or version history. Integrity depends on how the person stores the copied text.
- One system per browser and up to 8 domains. When a saved record is reloaded, names longer than 80 characters and notes longer than 600 are truncated.

## Run locally

Requires Node.js 22.12 or later; earlier versions cannot run the test script or the production build.

```bash
git clone https://github.com/GLOBAL-AI-GOVERNANCE/containment-ledger.git
cd containment-ledger
npm ci
npm test
npm run dev
```

Then open `http://127.0.0.1:4173/`.

The opening record is a synthetic mission-records cell. It is not an assessment of a real system.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

<!-- gaig:footer -->
## Part of Global AI Governance

Containment Ledger is an independent security boundary review instrument in the Global AI Governance portfolio.

- **Connect your agent:** [llms.txt](https://global-ai-governance.github.io/global-ai-governance-toolkit/llms.txt), [machine-interface.json](https://global-ai-governance.github.io/global-ai-governance-toolkit/machine-interface.json), and the [AI Governance Model Context Protocol Server](https://github.com/GLOBAL-AI-GOVERNANCE/ai-governance-mcp) (AI Governance MCP; command `gaig-mcp`). Compatible with Model Context Protocol (MCP) based agents.
- **Read the spec:** [versioned specifications](https://global-ai-governance.github.io/global-ai-governance-toolkit/connect.html#spec) and the [product map](https://github.com/GLOBAL-AI-GOVERNANCE/GLOBAL-AI-GOVERNANCE#product-map).

Outputs are non-authorizing (`authority_effect: NONE`). Not affiliated with or endorsed by any AI lab or platform.
<!-- /gaig:footer -->
