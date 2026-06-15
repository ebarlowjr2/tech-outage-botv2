import type { NormalizedOutageEvent, OutageStatus, Severity } from "./types";

export function normalizeSeverity(input?: string): Severity {
  const value = (input || "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("major outage") ||
    value.includes("service unavailable") ||
    value.includes("down")
  ) {
    return "critical";
  }

  if (
    value.includes("major") ||
    value.includes("partial outage") ||
    value.includes("significant") ||
    value.includes("widespread")
  ) {
    return "major";
  }

  if (
    value.includes("minor") ||
    value.includes("degraded") ||
    value.includes("intermittent") ||
    value.includes("latency")
  ) {
    return "minor";
  }

  return "info";
}

export function normalizeStatus(input?: string): OutageStatus {
  const value = (input || "").toLowerCase();

  if (value.includes("investigating")) return "investigating";
  if (value.includes("identified")) return "identified";
  if (value.includes("monitoring")) return "monitoring";
  if (value.includes("resolved")) return "resolved";
  if (value.includes("maintenance")) return "maintenance";
  if (value.includes("degraded")) return "degraded";
  if (value.includes("partial")) return "partial_outage";
  if (value.includes("major")) return "major_outage";

  return "unknown";
}

export function createDedupeKey(event: Partial<NormalizedOutageEvent>): string {
  const startedHour = event.started_at ? new Date(event.started_at).toISOString().slice(0, 13) : "unknown-time";

  return [
    event.provider || "unknown-provider",
    event.category || "unknown-category",
    event.location?.country || "unknown-country",
    event.location?.region || "unknown-region",
    event.network?.asn || "unknown-asn",
    event.service || "unknown-service",
    startedHour,
  ]
    .join(":")
    .toLowerCase();
}

export function isActiveOutageStatus(status: OutageStatus): boolean {
  return status !== "resolved" && status !== "maintenance";
}
