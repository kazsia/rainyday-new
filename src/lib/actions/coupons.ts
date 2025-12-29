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
    appliesTo?: 'all' | 'specific'
    applicableProductIds?: string[]
}

export async function validateCoupon(
    code: string,
    cartProductIds?: string[]
): Promise<CouponValidationResult> {
    if (!code) {
        return { valid: false, message: "Please enter a coupon code" }
    }

    const supabase = await createClient()

    // normalize code
    const normalizedCode = code.trim().toUpperCase()

    try {
        const { data: coupon, error } = await supabase
            .from("coupons")
            .select(`
                *,
                coupon_products (product_id)
            `)
            .ilike("code", normalizedCode)
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

        // Check product-specific restrictions
        if (coupon.applies_to === 'specific') {
            const couponProductIds = coupon.coupon_products?.map((cp: any) => cp.product_id) || []

            if (couponProductIds.length === 0) {
                return { valid: false, message: "This coupon has no valid products assigned" }
            }

            // If cart product IDs are provided, check if any match
            if (cartProductIds && cartProductIds.length > 0) {
                const matchingProducts = cartProductIds.filter(id => couponProductIds.includes(id))

                if (matchingProducts.length === 0) {
                    return { valid: false, message: "This coupon doesn't apply to items in your cart" }
                }

                // Return which products the coupon applies to
                return {
                    valid: true,
                    discount: {
                        type: coupon.discount_type,
                        value: Number(coupon.discount_value),
                        code: coupon.code
                    },
                    message: matchingProducts.length === cartProductIds.length
                        ? "Coupon applied successfully"
                        : "Coupon applied to eligible items",
                    appliesTo: 'specific',
                    applicableProductIds: matchingProducts
                }
            }

            // If no cart provided but coupon is specific, still return valid with product info
            return {
                valid: true,
                discount: {
                    type: coupon.discount_type,
                    value: Number(coupon.discount_value),
                    code: coupon.code
                },
                message: "Coupon applied successfully",
                appliesTo: 'specific',
                applicableProductIds: couponProductIds
            }
        }

        // Coupon applies to all products
        return {
            valid: true,
            discount: {
                type: coupon.discount_type,
                value: Number(coupon.discount_value),
                code: coupon.code
            },
            message: "Coupon applied successfully",
            appliesTo: 'all'
        }

    } catch (error) {
        console.error("Coupon validation error:", error)
        return { valid: false, message: "Error validating coupon" }
    }
}

export async function incrementCouponUsage(code: string) {
    const { createAdminClient } = await import("@/lib/supabase/server")
    const supabase = await createAdminClient()
    const { data: coupon, error: fetchError } = await supabase
        .from("coupons")
        .select("id, used_count")
        .ilike("code", code.trim().toUpperCase())
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
