# Engineering Principles

## Core Principles

- Keep the main care workflow working.
- Protect household/member boundaries with tests.
- Keep runtime entry points thin.
- Keep domain logic independent from D1 and LINE.
- Use repository boundaries for storage access.
- Prefer small vertical slices over broad rewrites.
- Add regression coverage before expanding behavior.

## Architecture Rules

- `household_id` must stay explicit.
- `member_id` must stay explicit.
- `line_user_id` is used for identity mapping and future caregiver traceability.
- Medication is member-scoped.
- Inventory is household-scoped and deferred.
- D1 is infrastructure, not domain logic.

## Implementation Rules

- Do not copy Maliwan 1.0 runtime code.
- Do not copy Big Crew runtime code.
- Do not add inventory or admin UI while working on medication slices.
- Do not introduce real external services in smoke tests.
- Keep tests fake/mock based until deployment work is intentionally scoped.
- Keep changes small enough to review.

## Verification

Before committing an implementation slice, run:

```bash
npm test
```

For the current read-only medication flow, also run:

```bash
npm run smoke:line-read
```
