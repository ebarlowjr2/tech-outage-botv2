"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle, CheckCircle, Server } from 'lucide-react'

type Incident = {
    id: string
    title: string
    status: string
    severity: string
    provider_id: string
    // We'd join provider name in a real app, strict typing skipped for v1 speed
    last_update: string
}

export default function IncidentList() {
    const [incidents, setIncidents] = useState<Incident[]>([])

    useEffect(() => {
        fetchIncidents()

        const channel = supabase
            .channel('incidents-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
                fetchIncidents() // Simple refresh on any change
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchIncidents() {
        const { data } = await supabase
            .from('incidents')
            .select('*')
            .eq('active', true)
            .order('last_update', { ascending: false })

        if (data) setIncidents(data)
    }

    return (
        <div className="w-80 h-full border-r border-gray-800 bg-black/90 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                <AlertCircle className="text-red-500" /> Active Incidents
            </h2>
            <div className="space-y-4">
                {incidents.length === 0 && (
                    <div className="text-gray-500 text-sm">No active incidents. Systems operational.</div>
                )}
                {incidents.map((incident) => (
                    <div key={incident.id} className="p-3 border border-gray-800 rounded bg-gray-900/50 hover:bg-gray-900 transition-colors">
                        <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-gray-200">{incident.title}</span>
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${incident.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                                    incident.severity === 'major' ? 'bg-orange-500' : 'bg-yellow-500'
                                }`} />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{incident.status}</span>
                            <span>{new Date(incident.last_update).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
