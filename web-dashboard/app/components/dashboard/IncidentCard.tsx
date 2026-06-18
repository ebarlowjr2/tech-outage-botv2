import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { cn } from "@/lib/utils";
import { getCategoryDisplay } from "@/lib/categoryDisplay";

interface IncidentCardProps {
  incident: Incident;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function IncidentCard({ incident, selected, onSelect }: IncidentCardProps) {
  const category = getCategoryDisplay(incident.category);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(incident.id)}
      className={cn("incident-card text-left", selected && "selected")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[color:var(--muted-2)] uppercase tracking-[0.26em]">{incident.provider}</div>
        <SeverityBadge severity={incident.severity} />
      </div>
      <div className="text-[11px] text-[color:var(--muted-2)] uppercase tracking-[0.32em]">
        {incident.isResolved ? "Recent resolved" : category.label}
      </div>
      <div className="text-sm text-white/90">{incident.title}</div>
      <div className="flex items-center justify-between text-xs text-[color:var(--muted)] mt-2 font-mono">
        <div className="flex items-center gap-4">
          <span>{incident.region}</span>
          <span className="uppercase tracking-[0.28em] text-[10px]">{incident.status}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[color:var(--muted-2)]">
          <span>{incident.timestamp}</span>
          <span>{incident.updates} updates</span>
        </div>
      </div>
    </button>
  );
}
