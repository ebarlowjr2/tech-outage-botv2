import { IngestStatus, ProviderSummary, RecentUpdate, SeverityCounts } from "../types";

export const severityCounts: SeverityCounts = {
  critical: 2,
  major: 5,
  minor: 5,
  info: 0,
};

export const providerSummary: ProviderSummary[] = [
  { provider: "AWS", impacted: 6, severity: "critical" },
  { provider: "Google Cloud", impacted: 4, severity: "major" },
  { provider: "Stripe", impacted: 3, severity: "critical" },
  { provider: "ERCOT", impacted: 3, severity: "major" },
  { provider: "Microsoft 365", impacted: 2, severity: "major" },
];

export const recentUpdates: RecentUpdate[] = [
  { id: "up-01", message: "AWS acknowledges root cause in us-east-1", time: "2m ago" },
  { id: "up-02", message: "Stripe rerouting traffic to secondary cluster", time: "6m ago" },
  { id: "up-03", message: "Google Cloud cache flush underway", time: "9m ago" },
  { id: "up-04", message: "ERCOT reserve margin remains under watch", time: "14m ago" },
];

export const ingestStatus: IngestStatus[] = [
  { pipeline: "Statuspage Scrape", state: "Nominal", detail: "12 sources" },
  { pipeline: "Webhook Queue", state: "Delayed", detail: "2.3s avg lag" },
  { pipeline: "Social Signals", state: "Attention", detail: "Rate-limited" },
];
