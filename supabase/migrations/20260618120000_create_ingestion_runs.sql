CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  events_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_started
ON public.ingestion_runs(source, started_at DESC);

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ingestion runs"
ON public.ingestion_runs
FOR SELECT
USING (true);
