"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function createOrder(order: {
    email: string
    total: number
    currency?: string
    items: Array<{ product_id: string; quantity: number; price: number }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const readableId = `RD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create order
    const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: user?.id,
            email: order.email,
            total: order.total,
            currency: order.currency || "USD",
            readable_id: readableId,
        })
        .select()
        .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = order.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
    }))

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

    if (itemsError) throw itemsError

    return newOrder
}

export async function getOrder(id: string) {
    const supabase = await createClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const query = supabase
        .from("orders")
        .select(`
      *,
      order_items (
        *,
        product:products (*)
      ),
      payments (*),
      deliveries (*),
      invoices (*)
    `)

    if (isUuid) {
        query.eq("id", id)
    } else {
        query.eq("readable_id", id)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
}

export async function getUserOrders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      order_items (
        *,
        product:products (name, image_url)
      )
    `)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false })

    if (error) throw error
    return data
}

export async function updateOrderStatus(
    id: string,
    status: 'pending' | 'paid' | 'delivered' | 'completed' | 'cancelled' | 'refunded'
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function adminGetOrders() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                profiles:user_id (email),
                order_items (
                    *,
                    product:products (name)
                ),
                payments (*)
            `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[ADMIN_GET_ORDERS] Fetch error:", error)
            return []
        }
        return data
    } catch (e) {
        console.error("[ADMIN_GET_ORDERS_CRITICAL]", e)
        return []
    }
}

export async function adminGetOrder(id: string) {
    try {
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                profiles:user_id (email),
                order_items (
                    *,
                    product:products (name, image_url)
                ),
                payments (*),
                deliveries (*),
                invoices (*)
            `)
            .eq("id", id)
            .single()

        if (error) {
            console.error("[ADMIN_GET_ORDER] Fetch error:", error)
            return null
        }
        return data
    } catch (e) {
        console.error("[ADMIN_GET_ORDER_CRITICAL]", e)
        return null
    }
}
