# AGENTS.md

Instructions for coding agents working in this repository.

## Setup and checks

```bash
npm ci
npm test
VITE_BASE=/containment-ledger/ npm run build
test -f dist/index.html
```

Local preview: serve `dist/` (or run the Vite preview script from `package.json`).

## Rules

- The ledger is a local browser structural review aid. It does not upload reviews and does not certify security.
- Edit `src/`; CI builds `dist/`. Do not hand-edit production bundles as the source of truth.
- Every public result keeps `authority_effect: "NONE"`. Do not add a path that approves, certifies, or authorizes.
- Prefer squash-merge through green CI. Do not force-push `main`.

## Setup guide

End-to-end local setup for the toolkit and MCP: [AGENT_SETUP](https://ai-governance.solutions/AGENT_SETUP.html).
