# ADR 001: Standalone Repo Boundary

## Status

Accepted

## Context

Maliwan 2.0 must be a new repository, separate from Maliwan 1.0 and separate from Big Crew.

The goal is to bootstrap a clean starting point for a household-aware care orchestrator without inheriting runtime code from either project.

## Decision

Create `maliwan-2` as a standalone repository with its own skeleton, docs, tests, and infrastructure placeholders.

Do not copy runtime code from Maliwan 1.0.
Do not copy runtime code from Big Crew.

## Consequences

- The repo can evolve independently.
- The boundary is clear for future D1-backed implementation work.
- The first implementation work can focus on member-scoped medication without dragging in old runtime code.
