"use client";

import { ReactNode } from "react";

type MainGridProps = {
  mapPanel: ReactNode;
  rightRail: ReactNode;
};

/**
 * MainGrid - Two-column layout for main content
 * 
 * Structure:
 * - Left: Map panel (8 cols on lg, full width on mobile)
 * - Right: Right rail with presenter + feed (4 cols on lg, full width on mobile)
 * 
 * Responsive: Stacks vertically on mobile
 */
export default function MainGrid({ mapPanel, rightRail }: MainGridProps) {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Map Panel - Primary content */}
      <div className="col-span-12 lg:col-span-8 h-full">
        {mapPanel}
      </div>

      {/* Right Rail - Presenter + Feed */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        {rightRail}
      </div>
    </div>
  );
}
