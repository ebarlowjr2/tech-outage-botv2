import { IngestStatus, ProviderSummary, RecentUpdate, SeverityCounts, SourceHealthItem } from "@/lib/types";
import { PanelFrame } from "./PanelFrame";
import { SourceHealthList } from "./SourceHealthList";

interface StatsRailProps {
  activeCount: number;
  severityCounts: SeverityCounts;
  providerSummary: ProviderSummary[];
  sourceHealth: SourceHealthItem[];
  recentUpdates: RecentUpdate[];
  ingestStatus: IngestStatus[];
}

export function StatsRail({
  activeCount,
  severityCounts,
  providerSummary,
  sourceHealth,
  recentUpdates,
  ingestStatus,
}: StatsRailProps) {
  const total = Object.values(severityCounts).reduce((sum, v) => sum + v, 0);
  const denominator = Math.max(total, 1);

  return (
    <div className="analytics-rail flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-1">
      <PanelFrame title="Active Outages" subtitle="Current tracked incidents">
        <div className="text-2xl font-semibold text-white/95">{activeCount}</div>
        <div className="text-xs text-[color:var(--muted)] mt-1">Monitoring {total} total signals</div>
      </PanelFrame>

      <PanelFrame title="Severity Mix" subtitle="Distribution by impact">
        <div className="stats-stack">
          {([
            ["Critical", severityCounts.critical, "var(--rose)"],
            ["Major", severityCounts.major, "var(--amber)"],
            ["Minor", severityCounts.minor, "var(--cyan)"],
            ["Info", severityCounts.info, "var(--teal)"],
          ] as const).map(([label, value, color]) => (
            <div key={label}>
              <div className="stat-row">
                <span>{label}</span>
                <span className="font-mono text-white/90">{value}</span>
              </div>
              <div className="stat-bar mt-2">
                <span style={{ width: `${value > 0 ? Math.max((value / denominator) * 100, 6) : 0}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </PanelFrame>

      <PanelFrame title="Provider Impact" subtitle="Highest affected providers">
        <div className="flex flex-col gap-2">
          {providerSummary.map((provider) => (
            <div key={provider.provider} className="flex items-center justify-between text-sm text-[color:var(--muted)]">
              <span className="text-white/90">{provider.provider}</span>
              <span className="font-mono">{provider.impacted} systems</span>
            </div>
          ))}
        </div>
      </PanelFrame>

      <PanelFrame title="Source Health" subtitle="Signal ingest status">
        <SourceHealthList items={sourceHealth} />
      </PanelFrame>

      <PanelFrame title="Recent Updates" subtitle="Latest changes">
        <div className="flex flex-col gap-2 text-xs text-[color:var(--muted)]">
          {recentUpdates.map((update) => (
            <div key={update.id} className="flex items-start justify-between gap-3">
              <span className="flex-1 text-white/90">{update.message}</span>
              <span className="font-mono text-[color:var(--muted-2)]">{update.time}</span>
            </div>
          ))}
        </div>
      </PanelFrame>

      <PanelFrame title="Ingest Status" subtitle="System pipeline">
        <div className="flex flex-col gap-2 text-xs text-[color:var(--muted)]">
          {ingestStatus.map((item) => (
            <div key={item.pipeline} className="flex items-center justify-between">
              <div>
                <div className="text-white/90">{item.pipeline}</div>
                <div className="text-[color:var(--muted-2)] mt-1">{item.detail}</div>
              </div>
              <span className="badge-pill">{item.state}</span>
            </div>
          ))}
        </div>
      </PanelFrame>
    </div>
  );
}
