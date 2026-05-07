# Staging Runtime Setup

Maliwan 2 must prove the staging Worker path before production LINE OA or mom beta.

## Current Scope

This setup adds:

- `wrangler.toml`
- staging and production environment placeholders
- one D1 binding name: `DB`
- `/health` endpoint
- local tests for the health endpoint and runtime config

This does not connect production LINE OA.
This does not deploy real production credentials.

## Environment Strategy

- default/test: local and automated test safety
- staging: deployed Worker smoke testing with fake or near-realistic data
- production: real household data only after release review

The code should use the binding name `DB`. Each environment must point `DB` to a different D1 database.

## Health Check

Current staging endpoint:

```text
https://maliwan-2-staging.msararin.workers.dev
```

Current health endpoint:

```text
https://maliwan-2-staging.msararin.workers.dev/health
```

The staging health endpoint should return a JSON response:

```json
{
  "ok": true,
  "service": "maliwan-2",
  "environment": "staging",
  "status": "ready"
}
```

## Local Verification

Run:

```bash
npm test
```

## Staging Deploy Steps

After replacing the staging D1 placeholder ID in `wrangler.toml`:

```bash
npx wrangler deploy --env staging
```

Then smoke test:

```bash
curl https://maliwan-2-staging.<your-workers-subdomain>.workers.dev/health
```

Expected result:

- HTTP 200
- `ok: true`
- `environment: staging`

Latest verified staging deployment:

- URL: `https://maliwan-2-staging.msararin.workers.dev`
- Version ID: `917fb725-c854-46b0-a3bd-ad1380a4be60`
- `/health`: HTTP 200 with `environment: staging`

## LINE OA Test Channel

Only connect a LINE OA test/staging channel after:

- staging deploy succeeds
- `/health` passes
- data environment is `staging`
- test data is separated from production data
- medication person scope remains verified

Production LINE OA remains out of scope for this setup.
