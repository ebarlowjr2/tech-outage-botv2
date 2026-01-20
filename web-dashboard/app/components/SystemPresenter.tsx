"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck } from 'lucide-react';
import { PresenterState } from '@/src/types/realtime';

type SystemPresenterProps = {
    presenterState: PresenterState;
    subtitleText: string | null;
    captionText: string | null;
    isSpeaking: boolean;
    lastSpokenAt: string | null;
};

export default function SystemPresenter(props: SystemPresenterProps) {
    const { presenterState, subtitleText, captionText, isSpeaking, lastSpokenAt } = props;

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
        <div className="absolute top-6 right-6 z-50 pointer-events-none flex flex-col items-end gap-4">
            {/* NOC BOT Panel */}
            <div className={`card p-4 flex items-center gap-4 transition-all duration-500 ${isActive ? "border-[color:var(--amber)] bg-[color:var(--bg)]" : "border-[color:var(--stroke)]"}`}>

                {/* Status Text */}
                <div className="flex flex-col items-end">
                    <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold">NOC BOT</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-mono font-bold transition-colors duration-500 ${isActive ? "text-[color:var(--amber)]" : "text-[color:var(--cyan)]"}`}>
                            {label}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-[color:var(--amber)] animate-ping" : "bg-[color:var(--cyan)]"}`} />
                    </div>
                </div>

                {/* Avatar Orb */}
                <motion.div
                    className="relative w-12 h-12 flex items-center justify-center"
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
                    <div className="relative z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center border border-white/20">
                        {isActive
                            ? <Activity className="w-5 h-5 text-[color:var(--amber)]" />
                            : <ShieldCheck className="w-5 h-5 text-[color:var(--cyan)]" />
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
            </div>

            {/* Captions Box */}
            {captionText && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="max-w-xl"
                >
                    <div className="bg-black/80 text-[color:var(--text)] text-lg font-medium px-6 py-4 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl text-center leading-relaxed">
                        <span className="text-[color:var(--amber)] mr-3">▶</span>
                        {captionText}
                    </div>
                </motion.div>
            )}

            {/* Subtitle (optional) */}
            {subtitleText && (
                <div className="text-sm text-[color:var(--muted)] text-right">
                    {subtitleText}
                </div>
            )}

            {/* Last spoken timestamp */}
            {lastSpokenAt && (
                <div className="text-xs text-white/30 font-mono">
                    Last: {new Date(lastSpokenAt).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}
