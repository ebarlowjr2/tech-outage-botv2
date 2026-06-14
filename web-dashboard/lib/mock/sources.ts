import { SourceHealthItem } from "../types";

export const sourceHealth: SourceHealthItem[] = [
  { id: "src-01", name: "AWS Health", status: "Healthy", latencyMs: 420, lastCheck: "15s ago" },
  { id: "src-02", name: "Google Cloud Status", status: "Healthy", latencyMs: 510, lastCheck: "22s ago" },
  { id: "src-03", name: "Cloudflare Status", status: "Lagging", latencyMs: 1320, lastCheck: "45s ago" },
  { id: "src-04", name: "GitHub Status", status: "Healthy", latencyMs: 390, lastCheck: "18s ago" },
  { id: "src-05", name: "Social Ingest", status: "Degraded", latencyMs: 2800, lastCheck: "1m ago" },
];
