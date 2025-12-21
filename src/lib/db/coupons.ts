import { createClient } from "@/lib/supabase/client"

export async function getCoupons() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) throw error
    return data
}

export async function createCoupon(coupon: {
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    max_uses?: number
    expires_at?: string
}) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("coupons")
        .insert([coupon])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteCoupon(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id)

    if (error) throw error
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    const supabase = createClient()
    const { error } = await supabase
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", id)

    if (error) throw error
}
