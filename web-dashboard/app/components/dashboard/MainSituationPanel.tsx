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

        <div className="hero-status-line">
          <span>{incident.provider}</span>
          <span>{incident.timestamp}</span>
        </div>

        <section className="hero-incident-card">
          <div className="small-label">Selected signal</div>
          <h2 className="mt-3 text-xl font-semibold text-white/95 leading-tight">
            {incident.title}
          </h2>
          <p className="text-xs text-[color:var(--muted)] mt-3 leading-relaxed">
            {incident.summary}
          </p>
        </section>

        <div className="hero-meta-grid">
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

        <div className="hero-impacted-services">
          Impacted services: {incident.impactedServices.join(" · ")}
        </div>

        <PresenterDockPlaceholder />
        <CaptionBarPlaceholder />
      </div>
    </div>
  );
}
