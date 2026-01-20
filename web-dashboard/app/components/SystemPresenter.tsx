"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Mic, ShieldCheck } from 'lucide-react'

export default function SystemPresenter() {
    const [activeAlert, setActiveAlert] = useState<string | null>(null)

    useEffect(() => {
        const channel = supabase
            .channel('presenter-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_events' }, (payload) => {
                triggerAlert(payload.new.description)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    function triggerAlert(text: string) {
        setActiveAlert(text)
        // Audio trigger would go here
        setTimeout(() => setActiveAlert(null), 8000)
    }

    return (
        <div className="absolute top-6 right-6 z-50 pointer-events-none flex flex-col items-end gap-4">
            {/* NOC BOT Panel */}
            <div className={`card p-4 flex items-center gap-4 transition-all duration-500 ${activeAlert ? "border-[color:var(--amber)] bg-[color:var(--bg)]" : "border-[color:var(--stroke)]"}`}>

                {/* Status Text */}
                <div className="flex flex-col items-end">
                    <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold">NOC BOT</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-mono font-bold transition-colors duration-500 ${activeAlert ? "text-[color:var(--amber)]" : "text-[color:var(--cyan)]"}`}>
                            {activeAlert ? "OUTAGE DETECTED" : "STANDING BY"}
                        </span>
                        {/* Status Dot */}
                        <div className={`w-2 h-2 rounded-full ${activeAlert ? "bg-[color:var(--amber)] animate-ping" : "bg-[color:var(--cyan)]"}`} />
                    </div>
                </div>

                {/* Avatar Orb */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    {/* Gradient Orb */}
                    <div className={`absolute inset-0 rounded-full blur-md opacity-60 transition-all duration-1000 ${activeAlert
                            ? "bg-gradient-to-r from-[color:var(--amber)] to-[color:var(--rose)] animate-pulse"
                            : "bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--violet)]"
                        }`} />

                    {/* Inner Core */}
                    <div className="relative z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center border border-white/20">
                        {activeAlert
                            ? <Activity className="w-5 h-5 text-[color:var(--amber)]" />
                            : <ShieldCheck className="w-5 h-5 text-[color:var(--cyan)]" />
                        }
                    </div>
                </div>
            </div>

            {/* Captions / Subtitle Bar */}
            <AnimatePresence>
                {activeAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="max-w-xl"
                    >
                        <div className="bg-black/80 text-[color:var(--text)] text-lg font-medium px-6 py-4 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl text-center leading-relaxed">
                            <span className="text-[color:var(--amber)] mr-3">▶</span>
                            {activeAlert}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
