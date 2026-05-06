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

## Validation

Run:

```bash
npm test
```

## Notes

This repo is a bootstrap skeleton only.
It is not yet the full Maliwan 2.0 implementation.
