# maliwan-2

`maliwan-2` is a standalone repository for Maliwan 2.0.

It is intentionally separate from:
- Maliwan 1.0
- Big Crew

This repo starts as a skeleton only. It does not copy runtime code from either project.

## Purpose

Maliwan 2.0 is intended to become a household-aware care orchestrator.

The first technical foundation is a Cloudflare Worker plus Cloudflare D1 validation skeleton with:
- household-aware sessions
- member-scoped medication as the first domain slice
- household-scoped inventory deferred
- admin UI deferred
- JSON seed data acceptable for early setup
- a repository boundary between domain logic and D1

## Current Scope

This repository currently contains:
- a minimal Node.js project skeleton
- placeholder domain and infrastructure folders
- a D1 schema draft placeholder
- a seed data placeholder
- a smoke test for skeleton imports

## Current Project Status

Maliwan 2 is in core flow stabilization.

- Read-only medication schedule flow works locally.
- D1 schema, repository contract, D1 adapter, orchestrator, and LINE-style handler wiring exist.
- Automated tests use fake data and must not touch production data.
- Production LINE OA integration is not connected yet.
- Next technical priority is P0 staging runtime setup before any mom beta or production LINE OA work.

## Staging Worker

Current staging endpoint:

```text
https://maliwan-2-staging.msararin.workers.dev
```

Health check:

```text
https://maliwan-2-staging.msararin.workers.dev/health
```

LINE OA test channel should remain disconnected until staging health, data separation, and smoke checks pass.

## Validation

Run:

```bash
npm test
```

For the current read-only medication flow smoke test:

```bash
npm run smoke:line-read
```

## Documentation

- [Project Vision](docs/PROJECT_VISION.md)
- [Roadmap](docs/ROADMAP.md)
- [Engineering Principles](docs/ENGINEERING_PRINCIPLES.md)
- [Codex Task Brief Template](docs/CODEX_TASK_BRIEF_TEMPLATE.md)
- [Data Environments](docs/DATA_ENVIRONMENTS.md)
- [Operating Model](docs/OPERATING_MODEL.md)
- [Staging Runtime](docs/STAGING_RUNTIME.md)
- [Architecture](docs/architecture.md)

## Notes

This repo is a bootstrap skeleton only.
It is not yet the full Maliwan 2.0 implementation.
