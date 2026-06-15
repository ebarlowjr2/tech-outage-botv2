import type { ConfidenceLevel, NormalizedOutageEvent } from "./types";

export function calculateConfidenceScore(event: Partial<NormalizedOutageEvent>): {
  confidence: ConfidenceLevel;
  confidence_score: number;
} {
  let score = 0;

  if (event.source_type === "official") score += 40;
  if (event.source_type === "measurement") score += 35;
  if (event.source_type === "commercial") score += 25;
  if (event.source_type === "aggregator") score += 20;
  if (event.source_type === "community") score += 10;
  if (event.source_type === "derived") score += 10;

  if (event.status && event.status !== "unknown") score += 10;

  if (event.location?.country) score += 5;
  if (event.location?.region) score += 5;
  if (event.location?.lat && event.location?.lon) score += 10;

  if (event.network?.asn) score += 10;
  if (event.network?.prefix) score += 5;

  if (event.started_at) score += 5;
  if (event.updated_at) score += 5;

  if (event.impact?.affected_regions?.length) score += 5;
  if (event.impact?.impacted_services?.length) score += 5;
  if (event.impact?.affected_users || event.impact?.affected_customers) score += 10;

  score = Math.min(score, 100);

  if (score >= 75) {
    return { confidence: "high", confidence_score: score };
  }

  if (score >= 45) {
    return { confidence: "medium", confidence_score: score };
  }

  return { confidence: "low", confidence_score: score };
}

// TODO: Boost confidence when two independent sources report similar provider,
// location, and time-window signals.
