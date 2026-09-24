"use client";

import { AnimatePresence, motion } from "framer-motion";

interface CaptionBarProps {
  text: string | null;
  isSpeaking: boolean;
}

export function CaptionBar({ text, isSpeaking }: CaptionBarProps) {
  return (
    <div className="caption-bar caption-bar--live">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="caption-bar-line"
          >
            <span className={`caption-cue${isSpeaking ? " caption-cue--on" : ""}`}>▶</span>
            <span className="caption-text">{text}</span>
          </motion.div>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="caption-idle"
          >
            Monitoring live outage feeds
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
