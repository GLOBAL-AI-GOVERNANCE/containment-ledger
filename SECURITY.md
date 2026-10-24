# Security Policy

This repository does not operate an external security-report intake. Do not place secrets, credentials, personal data, sensitive operational information, or vulnerability material in public GitHub surfaces.

## Security Scope

Security-relevant failure classes for this repository include:

- Review data leaving the browser (the instrument has no backend and makes no network calls with review content)
- Exported records that misstate a domain, path, evidence mark, or human disposition
- Script injection through imported or pasted review content
- Misleading certification, compliance, or approval wording
- Build and dependency supply-chain risk

## Principle

> No trust without verification.
