"use server"

import { createAdminClient } from "@/lib/supabase/server"

// Base stats to make the store look established (optional, can be set to 0)
const BASE_SALES = 1460
const BASE_BUYERS = 162

export async function getStoreStats() {
    try {
        const supabase = await createAdminClient()

        // 1. Get total sales (completed/paid orders)
        const { count: salesCount, error: salesError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["paid", "completed", "delivered"])

        if (salesError) {
            console.error("Error fetching sales stats:", salesError)
        }

        // 2. Get unique buyers
        const { data: buyersData, error: buyersError } = await supabase
            .from("orders")
            .select("email")

        let uniqueBuyers = 0
        if (buyersData) {
            uniqueBuyers = new Set(buyersData.map(o => o.email)).size
        }

        // 3. Get Average Rating
        const { data: feedbackData, error: feedbackError } = await supabase
            .from("feedbacks")
            .select("rating")
            .eq("is_approved", true)

        let averageRating = 4.98 // Default fallback
        if (feedbackData && feedbackData.length > 0) {
            const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0)
            averageRating = sum / feedbackData.length
        }

        return {
            sales: BASE_SALES + (salesCount || 0),
            buyers: BASE_BUYERS + uniqueBuyers,
            rating: averageRating.toFixed(2)
        }

    } catch (error) {
        console.error("Critical error in getStoreStats:", error)
        return {
            sales: BASE_SALES,
            buyers: BASE_BUYERS,
            rating: "4.98"
        }
    }
}
