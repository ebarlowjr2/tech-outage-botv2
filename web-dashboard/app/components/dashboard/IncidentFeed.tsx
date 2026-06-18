import { Incident } from "@/lib/types";
import { IncidentCard } from "./IncidentCard";

interface IncidentFeedProps {
  incidents: Incident[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function IncidentFeed({ incidents, selectedId, onSelect }: IncidentFeedProps) {
  if (!incidents.length) {
    return (
      <div className="incident-feed flex-1 min-h-0 flex items-center justify-center pr-1">
        <div className="text-center text-xs text-[color:var(--muted)]">
          <div className="kicker">Global Watch</div>
          <div className="mt-3">No matching outage signals in the current filter view.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="incident-feed flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          selected={incident.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
