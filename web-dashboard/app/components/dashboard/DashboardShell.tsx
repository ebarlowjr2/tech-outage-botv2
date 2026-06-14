import { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return <div className="dashboard-shell">{children}</div>;
}
