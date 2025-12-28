"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSiteSettings } from "@/lib/db/settings"
import crypto from "crypto"

/**
 * Triggered after a payment is marked as 'completed'
 * This function picks available assets and creates a delivery record.
 */
export async function deliverProduct(orderId: string) {
    const supabase = await createAdminClient()
    const settings = await getSiteSettings()
    const webhookSecret = settings.integrations.webhook_secret || ""

    // 1. Get the order and items
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("id", orderId)
        .single()

    if (orderError) throw orderError
    if (order.status !== 'paid') {
        console.warn(`Order ${orderId} is not in 'paid' status. Current: ${order.status}`)
        return
    }

    const deliveredAssets: any[] = []

    let deliveryFailure = false

    // 2. For each item, claim stock or fetch from dynamic webhook
    for (const item of order.order_items) {
        // Fetch product details for items
        const { data: product, error: prodError } = await supabase
            .from("products")
            .select("*")
            .eq("id", item.product_id)
            .single()

        if (!product) continue

        // Fetch variant details if variant_id exists
        let variant = null
        if (item.variant_id) {
            const { data: fetchedVariant, error: variantError } = await supabase
                .from("product_variants")
                .select("*")
                .eq("id", item.variant_id)
                .single()
            if (variantError) {
                console.error(`Failed to fetch variant ${item.variant_id}:`, variantError)
                // Continue without variant details if there's an error
            } else {
                variant = fetchedVariant
            }
        }

        if (product.delivery_type === 'serials') {
            try {
                const { data: assets, error: rpcError } = await supabase.rpc('claim_stock', {
                    p_product_id: item.product_id,
                    p_variant_id: item.variant_id || null,
                    p_quantity: item.quantity,
                    p_order_id: orderId,
                    p_selection_method: product.deliverable_selection_method || 'last'
                })

                if (rpcError) throw rpcError
                if (assets) {
                    assets.forEach((a: any) => deliveredAssets.push(a))
                }
            } catch (e) {
                console.error(`Failed to claim stock for item ${item.product_id}:`, e)
                throw e
            }
        } else if (product.delivery_type === 'dynamic' && (variant?.webhook_url || product.webhook_url)) {
            try {
                const dynamicAssets = await deliverDynamic(product, item, order, webhookSecret)
                if (dynamicAssets) {
                    dynamicAssets.forEach(a => deliveredAssets.push(a))
                }

                // Decrement stock for dynamic if not unlimited
                const isUnlimited = variant ? variant.is_unlimited : product.is_unlimited
                if (!isUnlimited) {
                    if (item.variant_id) {
                        await supabase.rpc('increment_variant_stock', { p_variant_id: item.variant_id, p_amount: -item.quantity })
                    } else {
                        await supabase.rpc('increment_stock', { p_product_id: item.product_id, p_amount: -item.quantity })
                    }
                }
            } catch (e) {
                console.error(`Dynamic delivery failed for product ${product.id}:`, e)
                deliveryFailure = true
            }
        } else if (product.delivery_type === 'service') {
            // Decrement stock for service if not unlimited
            const isUnlimited = variant ? variant.is_unlimited : product.is_unlimited
            if (!isUnlimited) {
                if (item.variant_id) {
                    await supabase.rpc('increment_variant_stock', { p_variant_id: item.variant_id, p_amount: -item.quantity })
                } else {
                    await supabase.rpc('increment_stock', { p_product_id: item.product_id, p_amount: -item.quantity })
                }
            }
        }
    }

    // 3. Create the delivery record - ALWAYS create one even if no assets
    // This ensures the invoice page shows proper delivery status
    const hasAssets = deliveredAssets.length > 0

    // Check if there are any service-type products (no serials needed)
    const hasServiceProducts = await (async () => {
        for (const item of order.order_items) {
            const { data: product } = await supabase
                .from("products")
                .select("delivery_type")
                .eq("id", item.product_id)
                .single()
            if (product?.delivery_type === 'service') return true
        }
        return false
    })()

    const deliveryContent = hasAssets
        ? "Your digital assets are ready."
        : deliveryFailure
            ? "Automatic delivery failed. Please contact support."
            : hasServiceProducts
                ? "Your service order has been confirmed. You will receive further instructions via email."
                : "Your order has been processed."

    const { error: deliveryError } = await supabase
        .from("deliveries")
        .insert({
            order_id: orderId,
            delivery_assets: hasAssets ? deliveredAssets : [],
            content: deliveryContent,
            // 'status' column doesn't exist in schema, so we remove it. 
            // Order status is updated to 'delivered' separately below.

            // Schema has 'delivery_type', not 'type'.
            // Schema constraint allows: 'instant' or 'manual'.
            // atomic assets -> 'instant'
            // service/no-assets -> 'manual' (since fulfilled via email/offline, or just confirmed)
            delivery_type: hasAssets ? 'instant' : 'manual'
        })

    if (deliveryError) throw deliveryError

    // 4. Update order status
    await supabase
        .from("orders")
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq("id", orderId)

    // 5. Generate Invoice
    const invoiceNumber = `INV-${Date.now()}-${orderId.split('-')[0]}`
    await supabase
        .from("invoices")
        .insert({
            order_id: orderId,
            invoice_number: invoiceNumber,
            status: 'paid'
        })

    // 6. Send delivery email
    try {
        // Refetch order with delivery_url for email
        const { data: updatedOrder } = await supabase
            .from("orders")
            .select("id, readable_id, email, total, currency, created_at, delivery_url")
            .eq("id", orderId)
            .single()

        if (updatedOrder?.email) {
            const { sendDeliveryCompletedEmail } = await import("@/lib/email/email")

            // Map delivered assets with product names
            const assetsWithNames = deliveredAssets.map((asset: any) => ({
                content: asset.content || asset,
                product_name: asset.product_name || undefined
            }))

            await sendDeliveryCompletedEmail(updatedOrder, assetsWithNames)
        }
    } catch (emailError) {
        console.error("[EMAIL] Delivery email failed:", emailError)
        // Don't fail delivery on email error
    }

    return { success: true }
}

/**
 * Handles Dynamic Delivery via Webhook
 */
async function deliverDynamic(product: any, item: any, order: any, secret: string) {
    const payload = {
        event: "INVOICE.ITEM.DELIVER-DYNAMIC",
        id: order.id,
        created_at: order.created_at,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        email: order.email,
        status: "completed",
        price: item.price,
        currency: order.currency || "USD",
        amount: item.quantity,
        product_id: product.id,
        customer: {
            email: order.email,
        },
        custom_fields: order.custom_fields ? Object.entries(order.custom_fields as Record<string, any>)
            .filter(([key]) => key.startsWith(`${product.id}_`))
            .reduce((acc, [key, value]) => ({
                ...acc,
                [key.replace(`${product.id}_`, "")]: value
            }), {}) : {},
        item: {
            id: item.id,
            product_id: product.id,
            quantity: item.quantity,
            price: item.price,
            product: {
                id: product.id,
                name: product.name,
                variant_id: item.variant_id || null
            }
        },
        invoice_id: order.id
    }

    const body = JSON.stringify(payload)
    const signature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex")

    try {
        const url = item.variant?.webhook_url || product.webhook_url
        console.log(`[DYNAMIC_DELIVERY] Sending webhook to: ${url}`)

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Signature": signature
            },
            body
        })

        if (!response.ok) {
            throw new Error(`Webhook responded with status ${response.status}`)
        }

        const text = await response.text()
        // Split by newline and filter out empty lines
        const deliverables = text.split(/\r?\n/).filter(line => line.trim().length > 0)

        return deliverables.map(content => ({
            content,
            type: "text"
        }))
    } catch (error) {
        console.error("[DYNAMIC_DELIVERY_WEBHOOK_ERROR]", error)
        throw error
    }
}
