"use server"
import { createClient } from "@/lib/supabase/server"

export async function getCoupons() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("coupons")
            .select(`
                *,
                coupon_products (
                    product_id,
                    products:product_id (id, name, image_url)
                )
            `)
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
    applies_to?: 'all' | 'specific'
    product_ids?: string[]
}) {
    try {
        const supabase = await createClient()

        // Extract product_ids before inserting coupon
        const { product_ids, ...couponData } = coupon

        const { data, error } = await supabase
            .from("coupons")
            .insert([{
                ...couponData,
                applies_to: couponData.applies_to || 'all'
            }])
            .select()
            .single()

        if (error) throw error

        // If specific products are selected, create the junction records
        if (coupon.applies_to === 'specific' && product_ids && product_ids.length > 0) {
            const couponProducts = product_ids.map(productId => ({
                coupon_id: data.id,
                product_id: productId
            }))

            const { error: linkError } = await supabase
                .from("coupon_products")
                .insert(couponProducts)

            if (linkError) {
                console.error("[CREATE_COUPON] Failed to link products:", linkError)
                // Don't throw - coupon was created, just product links failed
            }
        }

        return data
    } catch (e) {
        console.error("[CREATE_COUPON_CRITICAL]", e)
        throw e
    }
}

export async function deleteCoupon(id: string) {
    try {
        const supabase = await createClient()
        // Junction table records will be deleted automatically via ON DELETE CASCADE
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

export async function getCouponProducts(couponId: string): Promise<string[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("coupon_products")
            .select("product_id")
            .eq("coupon_id", couponId)

        if (error) throw error
        return data?.map(cp => cp.product_id) || []
    } catch (e) {
        console.error("[GET_COUPON_PRODUCTS_CRITICAL]", e)
        return []
    }
}
