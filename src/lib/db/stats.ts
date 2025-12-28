"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSiteSettings } from "./settings"

// Base stats to make the store look established (optional, can be set to 0)
const BASE_SALES = 1460
const BASE_BUYERS = 162

export async function getStoreStats() {
    try {
        const supabase = await createAdminClient()
        const settings = await getSiteSettings()
        const { base_sales, base_buyers, base_rating } = settings.statistics

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
            .in("status", ["paid", "completed", "delivered"]) // Only count real buyers who paid

        let uniqueBuyers = 0
        if (buyersData) {
            uniqueBuyers = new Set(buyersData.map(o => o.email)).size
        }

        // 3. Get Average Rating
        const { data: feedbackData, error: feedbackError } = await supabase
            .from("feedbacks")
            .select("rating")
            .eq("is_approved", true)

        let averageRating = parseFloat(base_rating || "4.98")
        if (feedbackData && feedbackData.length > 0) {
            const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0)
            averageRating = sum / feedbackData.length
        }

        return {
            sales: (base_sales || 0) + (salesCount || 0),
            buyers: (base_buyers || 0) + uniqueBuyers,
            rating: averageRating.toFixed(2)
        }

    } catch (error) {
        console.error("Critical error in getStoreStats:", error)
        return {
            sales: 1460, // Design fallback
            buyers: 162,
            rating: "4.98"
        }
    }
}
