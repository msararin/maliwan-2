# Operating Model

This document explains who does what in the Maliwan 2 workflow.

## Big Crew

Big Crew is the planning and work-package generator.

It should be used for medium-risk and high-risk slices where product value, data boundaries, tests, and release readiness need to be clarified before implementation.

Big Crew does not run the Maliwan 2 app and does not own product truth long term. It may keep planning snapshots and curated examples.

## Codex

Codex implements scoped tasks in the repo after the work is clearly defined.

Codex should:

- inspect before editing
- keep changes small
- preserve existing behavior
- add or update tests
- avoid touching Maliwan 1 unless explicitly requested
- avoid production LINE OA or production data unless the task explicitly allows it

## Maliwan 2 App

`maliwan-2` is the active rebuild.

It owns the implementation for the senior-friendly household care assistant, including:

- medication schedule read flow
- future medication logging
- future inventory and menu flows
- data boundary and environment guardrails
- Cloudflare Worker runtime direction

## Cloudflare Runtime

Cloudflare Worker is the intended runtime for Maliwan 2.

Cloudflare D1 is the first SQL-backed data layer candidate. D1 should stay behind repository adapters so domain and orchestrator logic do not depend directly on SQL.

Staging runtime must be proven before production LINE OA integration.

## LINE OA

LINE OA is the user-facing channel.

LINE integration should be added carefully:

- start with a test channel or sandbox flow
- verify staging endpoint first
- avoid production webhook changes until staging smoke tests pass
- keep senior-friendly menu/button behavior central

## Mom Beta

Mom beta means real household usage.

It is blocked until:

- staging runtime is deployed and smoke-tested
- test data is separated from production data
- medication person scope is verified
- normal messages are not accidentally saved as inventory
- production data is not used in pipeline tests

## Next Runtime Priority

The next technical priority is P0 staging runtime setup:

- add `wrangler.toml`
- define staging environment
- prepare D1 staging binding placeholder or actual staging DB
- deploy staging Worker
- create health check endpoint
- run smoke test against deployed staging endpoint
- only then connect a LINE OA test channel
