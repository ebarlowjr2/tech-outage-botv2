import { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Info",
};

const classes: Record<Severity, string> = {
  critical: "sev-critical",
  major: "sev-major",
  minor: "sev-minor",
  info: "sev-info",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span className={cn("severity-badge", classes[severity], className)}>
      {labels[severity]}
    </span>
  );
}
