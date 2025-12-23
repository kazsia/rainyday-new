"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function createOrder(order: {
    email?: string | null
    total: number
    currency?: string
    items: Array<{ product_id: string; variant_id?: string | null; quantity: number; price: number }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const alphanumericPart = Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 6)
    const numericPart = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')
    const readableId = `${alphanumericPart.substring(0, 13)}-${numericPart}`

    // Create order
    const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: user?.id,
            email: order.email || null,
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
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price: item.price,
    }))

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

    if (itemsError) throw itemsError

    return newOrder
}

export async function updateOrder(id: string, updates: {
    email?: string
    total?: number
    items?: Array<{ product_id: string; variant_id?: string | null; quantity: number; price: number }>
}) {
    const supabase = await createClient()

    // 1. Update order base fields
    const orderUpdate: any = { updated_at: new Date().toISOString() }
    if (updates.email) orderUpdate.email = updates.email
    if (updates.total !== undefined) orderUpdate.total = updates.total

    const { data: updatedOrder, error: orderError } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("id", id)
        .select()
        .single()

    if (orderError) throw orderError

    // 2. Update order items if provided
    if (updates.items) {
        // Delete old items
        await supabase.from("order_items").delete().eq("order_id", id)

        // Insert new items
        const orderItems = updates.items.map((item) => ({
            order_id: id,
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            price: item.price,
        }))

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems)

        if (itemsError) throw itemsError
    }

    return updatedOrder
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
        product:products (*),
        variant:product_variants (*)
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
        product:products (name, image_url),
        variant:product_variants (name)
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
                    product:products (name),
                    variant:product_variants (name)
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
                    product:products (name, image_url),
                    variant:product_variants (name)
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

export async function markOrderAsPaid(id: string) {
    try {
        const supabase = await createAdminClient()

        // 1. Get order and items info
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, payments(*)")
            .eq("id", id)
            .single()

        if (orderError || !order) throw new Error("Order not found")
        if (order.status === "paid" || order.status === "completed" || order.status === "delivered") {
            return { success: true, message: "Order already paid" }
        }

        // 2. Ensure payment record exists
        let payment = order.payments?.[0]
        if (!payment) {
            const { data: newPayment, error: payError } = await supabase
                .from("payments")
                .insert({
                    order_id: id,
                    provider: "Manual/Admin",
                    amount: order.total,
                    currency: order.currency,
                    status: "pending"
                })
                .select()
                .single()

            if (payError) throw payError
            payment = newPayment
        }

        // 3. Update payment status (this triggers delivery logic automatically via lib/db/payments.ts)
        const { updatePaymentStatus } = await import("./payments")
        await updatePaymentStatus(payment.id, "completed", {
            provider: payment.provider || "Manual/Admin",
            payload: { type: "admin_manual_mark_as_paid", timestamp: new Date().toISOString() }
        })

        return { success: true }
    } catch (e: any) {
        console.error("[MARK_ORDER_AS_PAID_ERROR]", e)
        throw new Error(e.message || "Failed to mark order as paid")
    }
}

/**
 * Manually retrigger delivery for a paid order that may have missed automatic delivery.
 */
export async function retriggerDelivery(orderId: string) {
    try {
        const supabase = await createAdminClient()

        // 1. Verify order is paid/delivered
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, deliveries(*)")
            .eq("id", orderId)
            .single()

        if (orderError || !order) throw new Error("Order not found")
        if (!['paid', 'delivered', 'completed'].includes(order.status)) {
            throw new Error("Order must be paid before triggering delivery")
        }

        // 2. Check if delivery already exists
        if (order.deliveries && order.deliveries.length > 0) {
            return { success: true, message: "Order already has deliveries" }
        }

        // 3. Trigger delivery
        const { deliverProduct } = await import("@/lib/payments/delivery")

        // Set order temporarily to 'paid' for delivery function
        await supabase
            .from("orders")
            .update({ status: 'paid' })
            .eq("id", orderId)

        await deliverProduct(orderId)

        return { success: true, message: "Delivery triggered successfully" }
    } catch (e: any) {
        console.error("[RETRIGGER_DELIVERY_ERROR]", e)
        throw new Error(e.message || "Failed to trigger delivery")
    }
}
