"use server"

import { createAdminClient } from "@/lib/supabase/server"

export type Customer = {
    id: string
    email: string
    display_name: string | null
    created_at: string
    avatar_url: string | null
    orders?: any[]
}

export async function getCustomers() {
    const supabase = await createAdminClient()

    try {
        const { data: profiles, error } = await supabase
            .from("profiles")
            .select(`
                id,
                email,
                display_name,
                created_at,
                avatar_url
            `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching profiles:", error)
            throw error
        }

        return profiles as Customer[]
    } catch (error) {
        console.error("Failed to get customers:", error)
        return []
    }
}
