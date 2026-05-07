# Codex Task Brief Template

Use this template for implementation slices in `maliwan-2`.

```text
Task:

Target repo:
/Users/apple/maliwan-2

Mode:
Implementation

Touch old repo:
No

Context:

Goal:

Scope:

In scope:

Out of scope:

Architecture rules:
- Keep householdId / household_id explicit.
- Keep memberId / member_id explicit.
- Keep lineUserId / line_user_id explicit where identity traceability matters.
- Keep D1 behind repository adapters.
- Keep LINE formatting outside domain logic.

Acceptance criteria:
- npm test passes.
- Existing smoke tests still pass.
- New behavior is covered by focused tests.
- No inventory implementation is introduced.
- No admin UI is introduced.
- No Maliwan 1.0 runtime code is copied.
- No Big Crew runtime code is copied.

Manual smoke check:

Expected commit message:
```

## Risk Level Guide

- Low-risk task: use a lightweight checklist.
- Medium-risk task: use Big Crew plus decision trace.
- High-risk or new task type: use Big Crew plus decision trace plus manual review.

Use Big Crew for:

- D1 adapter changes.
- Repository contract changes.
- LINE webhook/runtime changes.
- State/session behavior.
- Medication logging.
- User identity mapping.
- Release/deploy flow.
