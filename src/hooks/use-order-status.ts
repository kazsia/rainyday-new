"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type OrderStatus = "pending" | "paid" | "delivered" | "cancelled" | "refunded"

export function useOrderStatus(orderId: string) {
    const [status, setStatus] = useState<OrderStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        // Get initial status
        supabase
            .from("orders")
            .select("status")
            .eq("id", orderId)
            .single()
            .then(({ data }) => {
                if (data) setStatus(data.status as OrderStatus)
                setLoading(false)
            })

        // Subscribe to changes
        const channel = supabase
            .channel(`order-${orderId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    setStatus(payload.new.status as OrderStatus)
                }
            )
            .subscribe()

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId])

    return { status, loading }
}
