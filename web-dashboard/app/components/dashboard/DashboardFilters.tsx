import { getCategoryDisplay } from "@/lib/categoryDisplay";
import type { OutageCategory } from "@/src/ingestion/types";
import { cn } from "@/lib/utils";

export type DashboardFilterState = {
  includeResolved: boolean;
  selectedCategories: OutageCategory[];
  confidence: Array<"high" | "medium" | "low">;
};

const categoryGroups: Array<{ key: string; label: string; categories: OutageCategory[] }> = [
  { key: "cloud", label: getCategoryDisplay("cloud").shortLabel, categories: ["cloud"] },
  { key: "telecom", label: getCategoryDisplay("telecom").shortLabel, categories: ["telecom"] },
  { key: "cellular", label: getCategoryDisplay("cellular").shortLabel, categories: ["cellular"] },
  { key: "satellite", label: getCategoryDisplay("satellite").shortLabel, categories: ["satellite"] },
  { key: "power", label: getCategoryDisplay("power").shortLabel, categories: ["power"] },
  { key: "cdn", label: getCategoryDisplay("cdn").shortLabel, categories: ["cdn"] },
  { key: "saas", label: getCategoryDisplay("saas").shortLabel, categories: ["saas"] },
  { key: "internet-routing", label: "Internet/BGP/DNS", categories: ["internet", "bgp", "dns"] },
];

interface DashboardFiltersProps {
  value: DashboardFilterState;
  onChange: (value: DashboardFilterState) => void;
}

export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  function toggleCategoryGroup(categories: OutageCategory[]) {
    const current = new Set(value.selectedCategories);
    const enabled = categories.every((category) => current.has(category));

    for (const category of categories) {
      if (enabled) {
        current.delete(category);
      } else {
        current.add(category);
      }
    }

    onChange({ ...value, selectedCategories: [...current] });
  }

  function toggleConfidence(confidence: "high" | "medium" | "low") {
    const current = new Set(value.confidence);
    if (current.has(confidence)) {
      current.delete(confidence);
    } else {
      current.add(confidence);
    }

    onChange({ ...value, confidence: [...current] as DashboardFilterState["confidence"] });
  }

  return (
    <div className="dashboard-filters">
      <button
        type="button"
        className={cn("filter-chip", !value.includeResolved && "active")}
        onClick={() => onChange({ ...value, includeResolved: false })}
      >
        Active only
      </button>
      <button
        type="button"
        className={cn("filter-chip", value.includeResolved && "active")}
        onClick={() => onChange({ ...value, includeResolved: true })}
      >
        Include resolved
      </button>

      {categoryGroups.map((group) => (
        <button
          type="button"
          key={group.key}
          className={cn(
            "filter-chip",
            group.categories.every((category) => value.selectedCategories.includes(category)) && "active",
          )}
          onClick={() => toggleCategoryGroup(group.categories)}
        >
          {group.label}
        </button>
      ))}

      <button
        type="button"
        className={cn("filter-chip", value.confidence.includes("high") && "active")}
        onClick={() => toggleConfidence("high")}
      >
        High confidence
      </button>
      <button
        type="button"
        className={cn("filter-chip", value.confidence.includes("medium") && "active")}
        onClick={() => toggleConfidence("medium")}
      >
        Medium confidence
      </button>
      <button
        type="button"
        className={cn("filter-chip", value.confidence.includes("low") && "active-muted")}
        onClick={() => toggleConfidence("low")}
      >
        Show low confidence
      </button>
    </div>
  );
}
