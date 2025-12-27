"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function createPayment(payment: {
    order_id: string
    provider: string
    amount: number
    currency?: string
    track_id?: string
    pay_url?: string
}) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from("payments")
            .insert({
                order_id: payment.order_id,
                provider: payment.provider,
                amount: payment.amount,
                currency: payment.currency || "USD",
                status: "pending",
                track_id: payment.track_id || null,
                pay_url: payment.pay_url || null,
            })
            .select()
            .single()

        if (error) {
            console.error("[CREATE_PAYMENT_DB_ERROR]", error)
            throw error
        }
        return data
    } catch (e) {
        console.error("[CREATE_PAYMENT_FATAL]", e)
        throw e
    }
}


export async function updatePaymentStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    details?: {
        trackId?: string
        providerPaymentId?: string
        payload?: any
        provider?: string
    }
) {
    const supabase = await createAdminClient() // Use admin client for status updates to bypass RLS if needed

    // ========================
    // IDEMPOTENCY CHECK
    // ========================
    const { data: existing } = await supabase
        .from("payments")
        .select("status, order_id")
        .eq("id", id)
        .single()

    // Prevent double processing of completed payments
    if (existing?.status === "completed" && status === "completed") {
        console.warn(`[SECURITY] Payment ${id} already completed, skipping duplicate webhook`)
        return { ...existing, alreadyProcessed: true }
    }

    const updates: any = {
        status,
        updated_at: new Date().toISOString(),
    }

    if (details?.trackId) updates.track_id = details.trackId
    if (details?.providerPaymentId) updates.provider_payment_id = details.providerPaymentId
    if (details?.provider) updates.provider = details.provider

    const { data: payment, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    // Log transaction event
    await supabase.from("payment_transactions").insert({
        payment_id: id,
        event_type: `status_updated_to_${status}`,
        raw_payload: details?.payload || {}
    })

    // If payment completed, update order status to 'paid'
    if (status === "completed") {
        const { updateOrderStatus } = await import("./orders")
        await updateOrderStatus(payment.order_id, "paid")

        // Trigger automated delivery
        const { deliverProduct } = await import("@/lib/payments/delivery")
        try {
            await deliverProduct(payment.order_id)
        } catch (deliveryError) {
            console.error("Automated delivery failed:", deliveryError)
        }

        // ========================
        // CREATE ADMIN NOTIFICATION
        // ========================
        try {
            const { data: order } = await supabase
                .from("orders")
                .select(`
                    email, total, readable_id,
                    order_items (
                        quantity, price,
                        product:products (name),
                        variant:product_variants (name)
                    ),
                    custom_fields
                `)
                .eq("id", payment.order_id)
                .single()

            if (order) {
                // Map products for Discord
                const products = order.order_items?.map((item: any) => ({
                    name: item.product?.name || "Product",
                    quantity: item.quantity,
                    price: item.price,
                    variant: item.variant?.name
                })) || []

                const { notifyPaymentConfirmed } = await import("@/lib/actions/create-notification")
                await notifyPaymentConfirmed(
                    payment.order_id,
                    order.readable_id || payment.order_id.slice(0, 6).toUpperCase(),
                    order.total || payment.amount,
                    order.email || "Unknown",
                    undefined, // cryptoAmount - we'll pass from details if available
                    details?.provider, // cryptoCurrency / payment method
                    details?.provider, // paymentMethod
                    products,
                    order.custom_fields || undefined
                )
            }
        } catch (notifyError) {
            // Don't fail payment on notification error
            console.error("Notification creation failed:", notifyError)
        }

        // ========================
        // SEND PAYMENT CONFIRMED EMAIL
        // ========================
        try {
            const { data: order } = await supabase
                .from("orders")
                .select("id, readable_id, email, total, currency, created_at")
                .eq("id", payment.order_id)
                .single()

            if (order?.email) {
                const { sendPaymentConfirmedEmail } = await import("@/lib/email/email")
                await sendPaymentConfirmedEmail(order, payment.amount, details?.provider)
            }
        } catch (emailError) {
            console.error("[EMAIL] Payment confirmed email failed:", emailError)
        }

        // ========================
        // GENERATE DELIVERY TOKEN
        // ========================
        try {
            const { data: order } = await supabase
                .from("orders")
                .select("email")
                .eq("id", payment.order_id)
                .single()

            if (order?.email) {
                const { generateDeliveryToken, generateDeliveryUrl } = await import("@/lib/security/delivery-tokens")
                const token = await generateDeliveryToken(payment.order_id, order.email)
                const deliveryUrl = generateDeliveryUrl(token)

                // Store the delivery URL in the order


                await supabase
                    .from("orders")
                    .update({
                        delivery_url: deliveryUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", payment.order_id)

                // Log security event
                await supabase.from("audit_logs").insert({
                    admin_id: null,
                    action: "delivery_token_generated",
                    target_table: "orders",
                    target_id: payment.order_id,
                    details: { email: order.email }
                })
            }
        } catch (tokenError) {
            console.error("Delivery token generation failed:", tokenError)
        }
    }

    return payment
}

export async function getPaymentByOrder(orderId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .single()

    if (error && error.code !== "PGRST116") throw error
    return data
}
