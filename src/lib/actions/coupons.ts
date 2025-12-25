"use server"

import { createClient } from "@/lib/supabase/server"

export type CouponValidationResult = {
    valid: boolean
    discount?: {
        type: 'percentage' | 'fixed'
        value: number
        code: string
    }
    message?: string
}

export async function validateCoupon(code: string): Promise<CouponValidationResult> {
    if (!code) {
        return { valid: false, message: "Please enter a coupon code" }
    }

    const supabase = await createClient()

    // normalize code
    const normalizedCode = code.trim()

    try {
        const { data: coupon, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("code", normalizedCode)
            .single()

        if (error || !coupon) {
            return { valid: false, message: "Invalid coupon code" }
        }

        if (!coupon.is_active) {
            return { valid: false, message: "This coupon is no longer active" }
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return { valid: false, message: "This coupon has expired" }
        }

        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return { valid: false, message: "This coupon has reached its usage limit" }
        }

        return {
            valid: true,
            discount: {
                type: coupon.discount_type,
                value: Number(coupon.discount_value),
                code: coupon.code
            },
            message: "Coupon applied successfully"
        }

    } catch (error) {
        console.error("Coupon validation error:", error)
        return { valid: false, message: "Error validating coupon" }
    }
}
export async function incrementCouponUsage(code: string) {
    const supabase = await createClient()
    const { data: coupon, error: fetchError } = await supabase
        .from("coupons")
        .select("id, used_count")
        .eq("code", code)
        .single()

    if (fetchError || !coupon) {
        console.error("Failed to find coupon for usage increment:", fetchError)
        return
    }

    const { error: updateError } = await supabase
        .from("coupons")
        .update({ used_count: coupon.used_count + 1 })
        .eq("id", coupon.id)

    if (updateError) {
        console.error("Failed to increment coupon usage:", updateError)
    }
}
