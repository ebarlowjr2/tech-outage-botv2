import type { OutageCategory } from "@/src/ingestion/types";

export type CategoryDisplay = {
  label: string;
  shortLabel: string;
};

export const CATEGORY_DISPLAY: Record<OutageCategory, CategoryDisplay> = {
  cloud: { label: "Cloud", shortLabel: "Cloud" },
  cdn: { label: "CDN / Edge", shortLabel: "CDN" },
  saas: { label: "SaaS", shortLabel: "SaaS" },
  telecom: { label: "Telecom", shortLabel: "Telecom" },
  cellular: { label: "Cellular", shortLabel: "Cellular" },
  satellite: { label: "Satellite", shortLabel: "Satellite" },
  power: { label: "Power", shortLabel: "Power" },
  bgp: { label: "BGP / Routing", shortLabel: "BGP" },
  dns: { label: "DNS", shortLabel: "DNS" },
  internet: { label: "Internet", shortLabel: "Internet" },
  data_center: { label: "Data Center", shortLabel: "Data Center" },
  unknown: { label: "Unknown", shortLabel: "Unknown" },
};

export function getCategoryDisplay(category?: string): CategoryDisplay {
  return CATEGORY_DISPLAY[(category as OutageCategory) || "unknown"] ?? CATEGORY_DISPLAY.unknown;
}
