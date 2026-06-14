import React from "react";
import { cn } from "@/lib/utils";

interface PanelFrameProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function PanelFrame({
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  children,
}: PanelFrameProps) {
  return (
    <div className={cn("panel-frame", className)}>
      {(title || subtitle || action) && (
        <div className="panel-header">
          <div>
            {title && <div className="kicker">{title}</div>}
            {subtitle && <div className="text-xs text-[color:var(--muted)] mt-1">{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </div>
  );
}
