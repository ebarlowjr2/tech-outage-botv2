import { TickerItem } from "../types";

export const tickerItems: TickerItem[] = [
  { id: "tk-01", text: "AWS Lambda errors climbing in us-east-1", tone: "alert" },
  { id: "tk-02", text: "Stripe checkout latency above 2.6s", tone: "alert" },
  { id: "tk-03", text: "Google Cloud Storage multi-region throttling", tone: "warn" },
  { id: "tk-04", text: "Discord voice regions failing over", tone: "warn" },
  { id: "tk-05", text: "OpenAI API throttling for high-volume tenants", tone: "info" },
  { id: "tk-06", text: "Monitor coverage: 48 sources online", tone: "info" },
];
