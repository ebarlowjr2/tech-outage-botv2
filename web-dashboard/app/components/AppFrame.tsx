"use client";

import { ReactNode } from "react";

type AppFrameProps = {
  header: ReactNode;
  main: ReactNode;
  subtitleOverlay?: ReactNode;
  ticker?: ReactNode;
};

/**
 * AppFrame - Enforces the layout contract for stream-safe framing
 * 
 * Structure:
 * - Fixed header area (min-height: 140px)
 * - Main content grid (fills remaining space)
 * - Subtitle overlay (fixed bottom, above ticker)
 * - Ticker bar (fixed bottom)
 * 
 * Stream-safe at 1280x720 and 1920x1080
 */
export default function AppFrame({ header, main, subtitleOverlay, ticker }: AppFrameProps) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[color:var(--text)]">
      {/* Subtitle Overlay - positioned above ticker, respects safe area */}
      {subtitleOverlay}

      {/* Main Frame Container */}
      <div className="relative mx-auto max-w-[1600px] px-6 py-6 h-screen flex flex-col">
        {/* Header Section - Fixed height, no overlap */}
        <div className="shrink-0" style={{ minHeight: "140px" }}>
          {header}
        </div>

        {/* Main Content - Fills remaining space */}
        <div className="flex-1 min-h-0 pt-4">
          {main}
        </div>

        {/* Ticker Bar - Fixed at bottom */}
        {ticker && (
          <div className="shrink-0 mt-4">
            {ticker}
          </div>
        )}
      </div>
    </div>
  );
}
