# Architecture

`maliwan-2` is built as a standalone repository with a clean boundary from Maliwan 1.0 and Big Crew.

## Intended Boundary

- `household_id` identifies a household.
- `member_id` identifies a person within a household.
- `line_user_id` maps LINE identity to a person.
- medication is member-scoped.
- inventory is household-scoped but deferred for now.
- domain logic must not couple directly to D1.

## Folder Direction

- `src/app` is the runtime entry boundary.
- `src/orchestrator` coordinates flows.
- `src/domain` holds business models and repository interfaces.
- `src/infrastructure` holds D1 placeholders and future adapters.
- `tests` holds smoke and regression coverage.

## D1 Boundary

Cloudflare D1 is the first SQL-backed data layer candidate.
The repository boundary should keep domain logic separate from D1-specific storage code.

## Data Environment Boundary

Maliwan 2 separates `test`, `staging`, and `production` data before LINE OA integration or real household beta testing.

- automated tests use fake/mock data only
- staging should use sandbox bindings and non-production users
- production requires explicit release review before real household data is used

See [Data Environments](DATA_ENVIRONMENTS.md).

## Deferred Areas

- inventory implementation
- admin UI
- full runtime migration
- copied runtime code from Maliwan 1.0 or Big Crew
