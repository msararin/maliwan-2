# Maliwan 2.0 Roadmap

## Current Stage

Core flow stabilization.

Maliwan 2.0 is currently proving the medication read flow in a standalone repo before adding stateful logging, deployment, inventory, or admin UI.

## Phase 0 - MVP Foundation

- LINE webhook direction defined.
- Cloudflare Worker skeleton exists.
- Cloudflare D1 schema boundary exists.
- Repository contract exists.
- D1 medication adapter exists.
- Read-only medication schedule flow works locally.
- Local smoke script exists for the read-only LINE-style handler.

## Phase 1 - Core Behavior Stabilization

- Main menu first.
- Prevent accidental saves.
- Medication today view works.
- Medication read flow is member-scoped: Rin / Benchawan.
- Medication logging works.
- Medication person-scoped logging is regression-tested.
- Invalid or missing member context returns safe fallback.
- Regression tests protect the core medication flow.

## Phase 2 - Architecture Cleanup

- Keep runtime entry points thin.
- Separate LINE event handling.
- Separate intent routing.
- Add state/session management.
- Keep D1 behind repository adapters.
- Keep orchestrator logic independent from LINE formatting.
- Separate response formatting from business rules.

## Phase 3 - Better Product Experience

- Senior-friendly buttons.
- Per-medication "กินยาแล้ว" confirmation.
- Clear confirmation messages.
- Clear recovery path back to the main menu.
- Better fallback messages.
- Household preference scoring after medication flow is stable.

## Phase 4 - Intelligence Layer

- Smarter menu recommendation.
- Household context.
- Lightweight rule-based assistant behavior.
- AI only where it adds value.
- Future RAG only after stable core workflows and guardrails.

## Not Now

- Admin dashboard.
- Complex AI agent.
- Autonomous multi-agent orchestration.
- Over-engineered recommendation engine.
- Inventory implementation.
- Production onboarding.
- Full migration from Maliwan 1.0.
