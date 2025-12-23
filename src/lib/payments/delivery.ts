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

    // 2. For each item, claim stock or fetch from dynamic webhook
    for (const item of order.order_items) {
        // Fetch product details for items
        const { data: product, error: prodError } = await supabase
            .from("products")
            .select("*")
            .eq("id", item.product_id)
            .single()

        if (!product) continue

        if (product.delivery_type === 'serials') {
            try {
                const { data: assets, error: rpcError } = await supabase.rpc('claim_stock', {
                    p_product_id: item.product_id,
                    p_variant_id: item.variant_id || null,
                    p_quantity: item.quantity,
                    p_order_id: orderId
                })

                if (rpcError) throw rpcError
                if (assets) {
                    assets.forEach((a: any) => deliveredAssets.push(a))
                }
            } catch (e) {
                console.error(`Failed to claim stock for item ${item.product_id}:`, e)
                throw e
            }
        } else if (product.delivery_type === 'dynamic' && product.webhook_url) {
            try {
                const dynamicAssets = await deliverDynamic(product, item, order, webhookSecret)
                if (dynamicAssets) {
                    dynamicAssets.forEach(a => deliveredAssets.push(a))
                }
            } catch (e) {
                console.error(`Dynamic delivery failed for product ${product.id}:`, e)
                // We might want to mark this item for manual retry or notify admin
            }
        }
    }

    // 3. Create the delivery record
    if (deliveredAssets.length > 0) {
        const { error: deliveryError } = await supabase
            .from("deliveries")
            .insert({
                order_id: orderId,
                delivery_assets: deliveredAssets,
                content: "Your digital assets are ready.",
                status: 'delivered',
                type: 'instant'
            })

        if (deliveryError) throw deliveryError
    }

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
        const response = await fetch(product.webhook_url, {
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
