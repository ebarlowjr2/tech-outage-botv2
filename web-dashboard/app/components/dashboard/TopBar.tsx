interface TopBarProps {
  localTime: string;
  utcTime: string;
  streamStatus: string;
  sourceCount: number;
}

export function TopBar({ localTime, utcTime, streamStatus, sourceCount }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="flex items-center gap-3">
        <div className="topbar-title">TECH OUTAGE MONITOR</div>
        <div className="badge-pill badge-live">
          <span className="w-2 h-2 rounded-full bg-[color:var(--rose)]" />
          LIVE
        </div>
      </div>
      <div className="topbar-group justify-center">
        <div className="topbar-chip">Global</div>
        <div className="topbar-chip">Defcon 5</div>
        <div className="topbar-chip">Stream</div>
      </div>
      <div className="topbar-group justify-end">
        <div className="flex flex-col items-end">
          <span className="small-label">Local</span>
          <span className="font-mono text-sm text-white/90">{localTime}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="small-label">UTC</span>
          <span className="font-mono text-sm text-white/90">{utcTime}</span>
        </div>
        <div className="badge-pill badge-health">{streamStatus}</div>
        <div className="badge-pill">Sources {sourceCount}</div>
      </div>
    </div>
  );
}
