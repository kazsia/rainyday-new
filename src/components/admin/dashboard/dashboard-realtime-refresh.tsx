"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function DashboardRealtimeRefresh() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to changes in core tables that affect dashboard stats
        const channel = supabase
            .channel('dashboard-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    console.log("[DASHBOARD] Orders table changed, refreshing...")
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                () => {
                    console.log("[DASHBOARD] Payments table changed, refreshing...")
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'order_items' },
                () => {
                    console.log("[DASHBOARD] Order items changed, refreshing...")
                    router.refresh()
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("[DASHBOARD] Real-time monitoring active")
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, supabase])

    return null
}
