"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

export function SalesNotifier() {
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('admin-sales-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: 'status=eq.paid'
                },
                (payload) => {
                    // Check if it just became paid
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((payload.old as any).status !== 'paid') {
                        // Play sound
                        const audio = new Audio('/sounds/cha-ching.mp3') // Placeholder path, I'll check if sounds exist or use a default
                        audio.play().catch(e => console.log('Audio play failed', e))

                        toast.success("New Sale!", {
                            description: `Order #${payload.new.id.slice(0, 6).toUpperCase()} has been paid.`,
                            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
                            duration: 5000,
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return null
}
