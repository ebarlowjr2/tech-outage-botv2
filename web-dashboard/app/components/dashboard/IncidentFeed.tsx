import { Incident } from "@/lib/types";
import { IncidentCard } from "./IncidentCard";

interface IncidentFeedProps {
  incidents: Incident[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function IncidentFeed({ incidents, selectedId, onSelect }: IncidentFeedProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
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
