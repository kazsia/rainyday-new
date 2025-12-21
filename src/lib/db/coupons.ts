"use server"
import { createClient } from "@/lib/supabase/server"

export async function getCoupons() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[GET_COUPONS] Fetch error:", error)
            return []
        }
        return data
    } catch (e) {
        console.error("[GET_COUPONS_CRITICAL]", e)
        return []
    }
}

export async function createCoupon(coupon: {
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    max_uses?: number
    expires_at?: string
}) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("coupons")
            .insert([coupon])
            .select()
            .single()

        if (error) throw error
        return data
    } catch (e) {
        console.error("[CREATE_COUPON_CRITICAL]", e)
        throw e
    }
}

export async function deleteCoupon(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("coupons")
            .delete()
            .eq("id", id)

        if (error) throw error
    } catch (e) {
        console.error("[DELETE_COUPON_CRITICAL]", e)
        throw e
    }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("coupons")
            .update({ is_active: isActive })
            .eq("id", id)

        if (error) throw error
    } catch (e) {
        console.error("[TOGGLE_COUPON_STATUS_CRITICAL]", e)
        throw e
    }
}
