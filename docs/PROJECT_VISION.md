# Maliwan 2.0 Project Vision

Maliwan 2.0 is a senior-friendly household care orchestrator.

It should help caregivers and senior family members complete practical daily care routines through familiar LINE-based interactions. The goal is not to build a generic chatbot. The goal is to reduce typing, reduce confusion, and make important household care tasks easier to track.

## Product Direction

- Support household-aware care workflows.
- Keep member-scoped medication data safe from household/member mix-ups.
- Make caregiver actions traceable through LINE identity mapping.
- Prefer simple, reviewable flows over broad automation.
- Keep portfolio-first learning visible while leaving room for production hardening later.

## First High-Value Workflow

Medication tracking is the first high-value workflow because it has clear safety risk and clear household/member boundaries.

The current implementation path is:

- D1 schema boundary.
- Medication repository contract.
- D1 medication adapter.
- Care orchestrator read behavior.
- LINE-style read handler.
- Local smoke verification.

## Deferred Product Areas

- Inventory.
- Admin UI.
- Meal planning.
- Production onboarding.
- Complex AI behavior.
- Full runtime migration from Maliwan 1.0.
