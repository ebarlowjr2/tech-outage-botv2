import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { PresenterDockPlaceholder } from "./PresenterDockPlaceholder";
import { CaptionBarPlaceholder } from "./CaptionBarPlaceholder";
import { RotatingGlobe } from "./RotatingGlobe";

interface MainSituationPanelProps {
  incident: Incident;
  incidents: Incident[];
}

export function MainSituationPanel({ incident, incidents }: MainSituationPanelProps) {
  return (
    <div className="panel-frame flex flex-col h-full">
      <div className="panel-header">
        <div>
          <div className="kicker">Global Situation</div>
          <div className="text-xs text-[color:var(--muted)] mt-1">Primary outage focus</div>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <span className="badge-pill">{incident.status}</span>
        </div>
      </div>
      <div className="hero-panel">
        <div className="hero-grid" />
        <div className="hero-map" />
        <RotatingGlobe incidents={incidents} selectedIncident={incident} />

        <div className="relative z-10 flex items-center justify-between text-xs text-[color:var(--muted-2)] uppercase tracking-[0.3em]">
          <span>{incident.provider}</span>
          <span>{incident.timestamp}</span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-semibold text-white/95 leading-tight">
            {incident.title}
          </h2>
          <p className="text-sm text-[color:var(--muted)] mt-3 leading-relaxed">
            {incident.summary}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-xs text-[color:var(--muted)]">
          <div>
            <div className="small-label">Region</div>
            <div className="font-mono text-sm text-white/90 mt-2">{incident.region}</div>
          </div>
          <div>
            <div className="small-label">Category</div>
            <div className="font-mono text-sm text-white/90 mt-2">{incident.category}</div>
          </div>
          <div>
            <div className="small-label">Updates</div>
            <div className="font-mono text-sm text-white/90 mt-2">{incident.updates}</div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[color:var(--muted-2)] uppercase tracking-[0.24em]">
          Impacted services: {incident.impactedServices.join(" · ")}
        </div>

        <PresenterDockPlaceholder />
        <CaptionBarPlaceholder />
      </div>
    </div>
  );
}
