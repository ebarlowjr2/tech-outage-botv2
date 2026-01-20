"use client";

import { motion, AnimatePresence } from 'framer-motion';

type SubtitleBarProps = {
    text: string | null;
    isSpeaking: boolean;
};

export default function SubtitleBar({ text, isSpeaking }: SubtitleBarProps) {
    return (
        <AnimatePresence>
            {isSpeaking && text && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-full px-6"
                >
                    <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-4 shadow-2xl">
                        <div className="text-center text-white text-lg font-medium leading-relaxed">
                            {text}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
