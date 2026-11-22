"use client";

import { motion } from "framer-motion";
import type { PresenterState } from "@/src/types/realtime";

interface RobotPresenterProps {
  state: PresenterState;
  isSpeaking: boolean;
}

const ACCENT: Record<PresenterState, string> = {
  IDLE: "#5ad8ff",
  TALKING: "#5ad8ff",
  ALERT: "#ffb454",
  RESOLVED: "#7cffb0",
};

const LABEL: Record<PresenterState, string> = {
  IDLE: "STANDING BY",
  TALKING: "ON AIR",
  ALERT: "ALERT",
  RESOLVED: "RESOLVED",
};

const MOUTH_BARS = [46, 53, 60, 67, 74];

export function RobotPresenter({ state, isSpeaking }: RobotPresenterProps) {
  const accent = ACCENT[state];
  const isIdle = state === "IDLE" && !isSpeaking;

  return (
    <div className="robot-presenter">
      <motion.svg
        viewBox="0 0 120 150"
        width="100%"
        height="118"
        role="img"
        aria-label={`Presenter robot: ${LABEL[state]}`}
        animate={{ y: isSpeaking ? [0, -1.5, 0] : [0, -3, 0] }}
        transition={{ duration: isSpeaking ? 0.5 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Antenna */}
        <line x1="60" y1="14" x2="60" y2="30" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <motion.circle
          cx="60"
          cy="11"
          r="4.5"
          fill={accent}
          animate={{ opacity: state === "ALERT" ? [1, 0.2, 1] : [0.6, 1, 0.6] }}
          transition={{ duration: state === "ALERT" ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Glow halo */}
        <motion.ellipse
          cx="60"
          cy="66"
          rx="46"
          ry="42"
          fill={accent}
          animate={{ opacity: isSpeaking ? [0.14, 0.24, 0.14] : 0.08 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: "blur(10px)" }}
        />

        {/* Ears / side pods */}
        <rect x="14" y="56" width="8" height="22" rx="4" fill="#0c1119" stroke={accent} strokeWidth="1.5" />
        <rect x="98" y="56" width="8" height="22" rx="4" fill="#0c1119" stroke={accent} strokeWidth="1.5" />

        {/* Head shell */}
        <rect x="22" y="30" width="76" height="72" rx="18" fill="#0c1119" stroke={accent} strokeWidth="2" />
        {/* Face screen */}
        <rect x="30" y="40" width="60" height="52" rx="12" fill="#05080e" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Eyes */}
        {[41, 67].map((x) => (
          <motion.rect
            key={x}
            x={x}
            y={52}
            width={12}
            height={14}
            rx={5}
            fill={accent}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={isIdle ? { scaleY: [1, 1, 0.1, 1] } : { scaleY: 1 }}
            transition={
              isIdle
                ? { duration: 4, times: [0, 0.92, 0.96, 1], repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          />
        ))}

        {/* Mouth — equalizer bars when speaking, flat line when idle */}
        {MOUTH_BARS.map((x, i) => (
          <motion.rect
            key={x}
            x={x}
            y={72}
            width={3.4}
            height={14}
            rx={1.7}
            fill={accent}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={
              isSpeaking
                ? { scaleY: [0.3, 1, 0.45, 0.85, 0.35] }
                : { scaleY: 0.22 }
            }
            transition={
              isSpeaking
                ? { duration: 0.42, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }
                : { duration: 0.3 }
            }
          />
        ))}

        {/* Neck + shoulders */}
        <rect x="52" y="102" width="16" height="8" fill="#0c1119" stroke={accent} strokeWidth="1.5" />
        <path d="M34 126 Q34 112 60 112 Q86 112 86 126 L86 132 L34 132 Z" fill="#0c1119" stroke={accent} strokeWidth="2" />
        <circle cx="60" cy="122" r="3" fill={accent} />
      </motion.svg>

      <div className="robot-status">
        <span className="robot-status-dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span style={{ color: accent }}>{LABEL[state]}</span>
      </div>
    </div>
  );
}
