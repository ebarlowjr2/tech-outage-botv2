import { TickerItem } from "@/lib/types";

const toneColor: Record<TickerItem["tone"], string> = {
  alert: "text-[color:var(--rose)]",
  warn: "text-[color:var(--amber)]",
  info: "text-[color:var(--teal)]",
};

export function StatusTicker({ items }: { items: TickerItem[] }) {
  const fallback: TickerItem = {
    id: "global-watch",
    text: "GLOBAL WATCH ACTIVE - No confirmed active outages detected - Monitoring cloud, telecom, satellite, power, CDN, DNS, and routing sources",
    tone: "info",
  };
  const sourceItems = items.length ? items : [fallback];
  const merged = [...sourceItems, ...sourceItems];

  return (
    <div className="ticker">
      <div className="topbar-chip">Ticker</div>
      <div className="flex-1 overflow-hidden">
        <div className="ticker-track">
          {merged.map((item, index) => (
            <div key={`${item.id}-${index}`} className={`text-[10px] uppercase tracking-[0.24em] ${toneColor[item.tone]}`}>
              {item.text}
            </div>
          ))}
        </div>
      </div>
      <div className="topbar-chip">Producer Mode</div>
      <div className="topbar-chip">Uptime 99.98%</div>
    </div>
  );
}
