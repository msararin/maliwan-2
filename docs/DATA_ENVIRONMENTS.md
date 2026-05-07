# Data Environments

Maliwan 2 separates data by environment before LINE OA integration or real household beta testing.

## Current Active Data Store

The current repo does not connect to production LINE, production Cloudflare D1, Google Apps Script, or Google Sheets.

Current data usage is local and test-oriented:

- `src/infrastructure/d1/schema.sql` defines the draft D1 schema.
- `src/infrastructure/d1/seed.example.json` contains example seed data for the Malaithong household.
- `tests/smoke.test.js` uses fake repositories and fake D1 objects.
- `tests/fixtures/` contains deterministic fake fixture data.
- `scripts/smoke-line-read.js` uses fake data only.

There is no `wrangler.toml` production binding in this repo yet.
There is no active Google Apps Script or Google Sheet runtime code in this repo yet.

The current active data store is therefore local test data plus repository-level D1 adapter tests. Production storage is not connected.

## Environments

### test

Used by automated tests and local smoke checks.

- Uses fake/mock data only.
- Uses deterministic fixtures from `tests/fixtures/`.
- Supports repository contract tests and handler tests.
- Must not read from or write to production D1, Google Sheet, Apps Script, or LINE OA resources.
- Must not use production-like data store names.

### staging

Used for future sandbox testing before production.

- May use Cloudflare D1 sandbox bindings.
- May use LINE sandbox or non-production test users.
- Must use clearly named staging resources.
- Must not use real household production medication data.
- Should be used for deployed Worker smoke testing before real household testing.

### production

Used only for real household beta or live usage after explicit release review.

- Requires separate secrets and bindings.
- Requires tests and smoke checks before deployment.
- Must keep medication person-scoped.
- Must not share production credentials with test or staging.
- Stores real household usage, real medication schedules, real medication logs, and real inventory data.

## Future D1 Binding Direction

When Cloudflare D1 bindings are added, code should use one binding name such as `DB`, while each environment points to a different database.

```toml
[[d1_databases]]
binding = "DB"
database_name = "maliwan2_test"
database_id = "test-database-id"

[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "maliwan2_staging"
database_id = "staging-database-id"

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "maliwan2_prod"
database_id = "production-database-id"
```

This repo does not include real database IDs yet.

## Fixture Rules

Test fixtures must be obviously fake and deterministic.

- Use names such as `test-rin`, `test-benchawan`, `TestMedMorning`, and `TestMedNight`.
- Medication fixtures must include `household_id`, `member_id`, and LINE identity traceability where relevant.
- Inventory fixtures may be household-scoped and should not include `member_id`.
- Pipeline tests must not depend on production data.

Medication is safety-sensitive because schedules and logs must belong to the correct person. Inventory and food context can be shared at the household level.

## Guardrail

`src/config/dataEnvironment.js` defines the supported data environments and a test guard:

- `test`
- `staging`
- `production`

Automated tests should call `assertAutomatedTestDataBoundary(...)` when validating data configuration. The guard rejects non-test environments and production-like data store names in automated tests.

If `NODE_ENV=test`, the guard also rejects any non-test data environment.

## Release Rule

Before LINE OA integration or real mom beta testing:

- confirm the target data environment
- verify production credentials are not used in tests
- run `npm test`
- run `npm run smoke:line-read`
- review the data store name and binding target

## Mom Beta Go/No-Go Checklist

Mom beta is blocked until:

- [ ] Maliwan 2 LINE OA webhook is connected to the correct deployed endpoint
- [ ] Test data is separate from production data
- [ ] Automated tests use fake fixtures only
- [ ] Staging smoke test passes
- [ ] Medication person scope is verified
- [ ] Bot does not accidentally save normal messages as inventory
- [ ] Production data is not used in pipeline tests

## Safe Commands

Run automated tests:

```bash
npm test
```

Run the current read-only LINE-style smoke check:

```bash
npm run smoke:line-read
```
