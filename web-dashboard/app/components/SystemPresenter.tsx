"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Radio } from 'lucide-react';
import { PresenterState } from '@/src/types/realtime';

type SystemPresenterProps = {
    presenterState: PresenterState;
    subtitleText: string | null;
    captionText: string | null;
    isSpeaking: boolean;
    lastSpokenAt: string | null;
};

export default function SystemPresenter(props: SystemPresenterProps) {
    const { presenterState, captionText, isSpeaking } = props;

    const isActive = presenterState !== 'IDLE';
    const accent =
        presenterState === 'TALKING' ? 'from-cyan-400/30 to-violet-400/25' :
            presenterState === 'ALERT' ? 'from-amber-400/30 to-rose-400/20' :
                presenterState === 'RESOLVED' ? 'from-lime-400/30 to-cyan-400/20' :
                    'from-cyan-400/20 to-violet-400/15';

    const label =
        presenterState === 'TALKING' ? 'SPEAKING' :
            presenterState === 'ALERT' ? 'NEW EVENT' :
                presenterState === 'RESOLVED' ? 'RESOLVED' :
                    'STANDING BY';

    return (
        <div className="card card-accent p-4 shrink-0">
            {/* NOC BOT Panel - now part of layout flow */}
            <div className="flex items-center justify-between gap-4">
                {/* Avatar Orb */}
                <motion.div
                    className="relative w-14 h-14 flex items-center justify-center shrink-0"
                    animate={
                        presenterState === 'IDLE' ? { scale: [1, 1.02, 1] } :
                            presenterState === 'TALKING' ? { scale: [1, 1.06, 1] } :
                                { scale: 1.03 }
                    }
                    transition={{ duration: presenterState === 'TALKING' ? 0.9 : 2.8, repeat: Infinity }}
                >
                    {/* Gradient Orb */}
                    <div className={`absolute inset-0 rounded-full blur-md opacity-60 transition-all duration-1000 bg-gradient-to-r ${accent}`} />

                    {/* Inner Core */}
                    <div className="relative z-10 w-12 h-12 bg-black/80 rounded-full flex items-center justify-center border border-white/20">
                        {isActive
                            ? <Activity className="w-6 h-6 text-[color:var(--amber)]" />
                            : <ShieldCheck className="w-6 h-6 text-[color:var(--cyan)]" />
                        }
                    </div>

                    {/* Speaking glow ring */}
                    {isSpeaking && (
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ opacity: [0.35, 0.8, 0.35] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            style={{
                                boxShadow: "0 0 28px rgba(90,240,255,0.35), 0 0 40px rgba(190,110,255,0.22)",
                            }}
                        />
                    )}
                </motion.div>

                {/* Status Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Radio className="w-3 h-3 text-[color:var(--cyan)]" />
                        <span className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold">NOC BOT</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSpeaking ? "bg-[color:var(--amber)] animate-ping" : isActive ? "bg-[color:var(--amber)]" : "bg-[color:var(--cyan)]"}`} />
                        <span className={`text-sm font-mono font-bold transition-colors duration-500 truncate ${isActive ? "text-[color:var(--amber)]" : "text-[color:var(--cyan)]"}`}>
                            {label}
                        </span>
                    </div>
                </div>

                {/* On Air Light */}
                <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-widest transition-all duration-300 shrink-0 ${
                    isSpeaking 
                        ? "bg-[color:var(--rose)]/20 border-[color:var(--rose)] text-[color:var(--rose)] animate-pulse" 
                        : "bg-white/5 border-white/10 text-white/40"
                }`}>
                    ON AIR
                </div>
            </div>

            {/* Caption Area - reserved space for future avatar/robot */}
            <AnimatePresence>
                {captionText && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <div className="bg-black/60 backdrop-blur-sm text-[color:var(--text)] text-sm font-medium px-4 py-3 rounded-xl border border-white/10 leading-relaxed">
                            <span className="text-[color:var(--amber)] mr-2">&#9654;</span>
                            {captionText}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Future Avatar/Robot Space Placeholder */}
            <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
                    <span>AVATAR_SLOT</span>
                    <span className="text-[color:var(--cyan)]/50">RESERVED</span>
                </div>
            </div>
        </div>
    );
}
