# Outage Ingestion Operations

## Manual ingestion test

Run the GitHub Actions workflow manually from:

Actions -> Outage Ingestion -> Run workflow

## Expected result

The workflow sends:

```text
POST /api/ingestion/outages/run
```

with:

```text
Authorization: Bearer $INGESTION_SECRET
```

## Required secrets

- INGESTION_SECRET

## App environment variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- INGESTION_SECRET
- CRON_SECRET
- STATUSGATOR_API_KEY, optional
- DOWNDETECTOR_API_KEY, optional
- POWEROUTAGE_US_API_KEY, optional
- ELECTRICITY_MAPS_API_KEY, optional

## Verification

After a successful run:

1. Check GitHub Actions logs.
2. Check Supabase `outage_events`.
3. Open `/api/outages?status=all`.
4. Open the dashboard and confirm the feed updates.

## Source Status

The dashboard reads source health from:

```text
GET /api/ingestion/status
```

The ingestion scheduler writes one `ingestion_runs` row per source so missing-key sources can be shown as disabled instead of silently disappearing.
