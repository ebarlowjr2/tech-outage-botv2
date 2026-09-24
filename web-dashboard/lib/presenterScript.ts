import type { Incident, Severity } from "@/lib/types";
import type { PresenterState } from "@/src/types/realtime";

const severityPhrase: Record<Severity, string> = {
  critical: "a critical outage",
  major: "a major disruption",
  minor: "a minor issue",
  info: "an advisory",
};

/** Which presenter mood an incident should trigger. */
export function presenterStateForIncident(incident: Incident): PresenterState {
  if (incident.isResolved) return "RESOLVED";
  if (incident.severity === "critical" || incident.severity === "major") return "ALERT";
  return "TALKING";
}

function regionClause(incident: Incident): string {
  const region = incident.region?.trim();
  if (!region || region.toLowerCase() === "worldwide") return "";
  return ` in ${region}`;
}

/** Spoken line for a single incident. Kept short and broadcast-friendly. */
export function buildAnnouncement(incident: Incident): string {
  const provider = incident.provider;
  const region = regionClause(incident);

  if (incident.isResolved) {
    return `Update: ${provider} reports that ${incident.title} has been resolved. Services are recovering${region}.`;
  }

  const severity = severityPhrase[incident.severity];
  const services = incident.impactedServices.filter(Boolean).slice(0, 2).join(" and ");
  const servicesClause = services ? ` affecting ${services}` : "";
  return `Heads up. ${provider} is reporting ${severity}${servicesClause}${region}. ${incident.title}.`;
}

const openingVariants = [
  (count: number, plural: string) => `Live outage watch. We are currently tracking ${count} active tech ${plural} across major providers.`,
  (count: number, plural: string) => `Status check. ${count} tech ${plural} are being monitored worldwide right now.`,
  (count: number, plural: string) => `Here is the current picture: ${count} active ${plural} on our board across cloud, telecom, and network providers.`,
];

/** Opening / idle "situation report" line. `seed` rotates the phrasing. */
export function buildOpeningReport(activeCount: number, seed = 0): string {
  if (activeCount <= 0) {
    return "All monitored systems are currently operational. Standing by for new tech outage signals.";
  }
  const plural = activeCount === 1 ? "outage" : "outages";
  const variant = openingVariants[seed % openingVariants.length];
  return variant(activeCount, plural);
}
