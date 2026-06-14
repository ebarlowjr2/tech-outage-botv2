import { SourceHealthItem } from "@/lib/types";

const statusColor: Record<SourceHealthItem["status"], string> = {
  Healthy: "text-[color:var(--teal)]",
  Lagging: "text-[color:var(--amber)]",
  Degraded: "text-[color:var(--rose)]",
};

export function SourceHealthList({ items }: { items: SourceHealthItem[] }) {
  return (
    <div className="source-health">
      {items.map((item) => (
        <div key={item.id} className="source-row">
          <div>
            <div className="text-sm text-white/90">{item.name}</div>
            <div className="text-[11px] text-[color:var(--muted-2)] mt-1">Last check {item.lastCheck}</div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${statusColor[item.status]}`}>{item.status}</div>
            <div className="text-[11px] text-[color:var(--muted-2)] font-mono mt-1">{item.latencyMs} ms</div>
          </div>
        </div>
      ))}
    </div>
  );
}
