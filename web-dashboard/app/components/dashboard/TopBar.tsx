"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  streamStatus: string;
  sourceCount: number;
  /** Optional overrides; when omitted a live ticking clock is shown. */
  localTime?: string;
  utcTime?: string;
}

function formatTime(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function TopBar({ streamStatus, sourceCount, localTime, utcTime }: TopBarProps) {
  // Placeholder until mount so server and client render the same markup (no hydration mismatch).
  const [clock, setClock] = useState<{ local: string; utc: string }>({
    local: "--:--:--",
    utc: "--:--:--",
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({ local: formatTime(now), utc: formatTime(now, "UTC") });
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const localDisplay = localTime ?? clock.local;
  const utcDisplay = utcTime ?? clock.utc;

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
          <span className="font-mono text-sm text-white/90 tabular-nums">{localDisplay}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="small-label">UTC</span>
          <span className="font-mono text-sm text-white/90 tabular-nums">{utcDisplay}</span>
        </div>
        <div className="badge-pill badge-health">{streamStatus}</div>
        <div className="badge-pill">Sources {sourceCount}</div>
      </div>
    </div>
  );
}
