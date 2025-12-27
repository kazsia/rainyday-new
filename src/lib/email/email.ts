"use server"

import { Resend } from "resend"
import { getSiteSettings } from "@/lib/db/settings"

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

type EmailOptions = {
    to: string
    subject: string
    html: string
    replyTo?: string
}

/**
 * Send an email using Resend
 */
async function sendEmail(options: EmailOptions) {
    const settings = await getSiteSettings()
    const fromName = settings.email?.from_name || settings.general?.name || "Rainyday"
    const fromEmail = settings.email?.from_email || "noreply@rainyday.cc"

    if (!resend) {
        console.log("[EMAIL] Resend not configured - would send:", {
            from: `${fromName} <${fromEmail}>`,
            ...options
        })
        return { success: false, error: "Resend API key not configured" }
    }

    if (settings.email?.enabled === false) {
        console.log("[EMAIL] Emails disabled in settings")
        return { success: false, error: "Emails disabled" }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            replyTo: options.replyTo
        })

        if (error) {
            console.error("[EMAIL] Send error:", error)
            return { success: false, error: error.message }
        }

        console.log("[EMAIL] Sent successfully:", data?.id)
        return { success: true, id: data?.id }
    } catch (error: any) {
        console.error("[EMAIL] Exception:", error)
        return { success: false, error: error.message }
    }
}

// ============================================================
// EMAIL TEMPLATES - Clean White Design
// ============================================================

function wrapTemplate(content: string, storeName: string = "Rainyday", invoiceUrl?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://rainyday-new.vercel.app")
    const logoUrl = `${baseUrl}/email-logo.png`

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storeName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #eee;">
                            <img src="${logoUrl}" alt="${storeName}" width="60" height="60" style="display: block; margin: 0 auto 12px auto;" />
                            <span style="font-size: 20px; font-weight: bold; color: #333;">${storeName}</span>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- View Invoice Button -->
                    ${invoiceUrl ? `
                    <tr>
                        <td style="padding: 0 40px 32px 40px; text-align: center;">
                            <a href="${invoiceUrl}" style="display: inline-block; background-color: #333; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">View Invoice</a>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #eee; text-align: center;">
                            <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Regards,<br/><strong>${storeName}</strong></p>
                            ${invoiceUrl ? `
                            <p style="margin: 16px 0 0 0; color: #999; font-size: 11px; line-height: 1.5;">
                                If you're having trouble clicking the "View Invoice" button, copy and paste the URL below into your web browser:<br/>
                                <a href="${invoiceUrl}" style="color: #00d4ff; word-break: break-all;">${invoiceUrl}</a>
                            </p>
                            ` : ''}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

// ============================================================
// EMAIL FUNCTIONS
// ============================================================

type OrderItem = {
    product_id: string
    quantity: number
    price: number
    product?: { name: string } | null
    variant?: { name: string } | null
}

type Order = {
    id: string
    readable_id?: string
    email?: string | null
    total: number
    currency?: string
    created_at: string
    order_items?: OrderItem[]
    delivery_url?: string
}

type DeliveryAsset = {
    content: string
    product_name?: string
}

/**
 * Send invoice created email
 */
export async function sendInvoiceCreatedEmail(order: Order) {
    if (!order.email) {
        console.log("[EMAIL] No email for order:", order.id)
        return
    }

    const settings = await getSiteSettings()
    const storeName = settings.general?.name || "Rainyday"
    const orderId = order.readable_id || order.id.slice(0, 8).toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://rainyday-new.vercel.app")
    const invoiceUrl = `${baseUrl}/invoice?id=${order.id}`

    const itemsHtml = order.order_items?.map(item => `
        <p style="margin: 0 0 8px 0; color: #333;">
            <strong>Product:</strong> ${item.product?.name || "Product"} ${item.variant?.name ? `(${item.variant.name})` : ""}<br/>
            <strong>Price:</strong> ${item.quantity} x $${item.price.toFixed(2)}
        </p>
    `).join("") || ""

    // Get customizable template content
    const subjectTemplate = settings.email?.invoice_subject || 'Order #{order_id} - {store_name}'
    const headingTemplate = settings.email?.invoice_heading || 'Order Confirmed! 🎉'
    const messageTemplate = settings.email?.invoice_message || 'Thank you for your order. Please complete payment to receive your items.'

    // Replace variables in templates
    const replaceVars = (template: string) => template
        .replace(/{order_id}/g, orderId)
        .replace(/{store_name}/g, storeName)
        .replace(/{email}/g, order.email || '')
        .replace(/{total}/g, `$${order.total.toFixed(2)}`)

    const subject = replaceVars(subjectTemplate)
    const heading = replaceVars(headingTemplate)
    const message = replaceVars(messageTemplate)

    const content = `
        <h2 style="margin: 0 0 16px 0; color: #333; font-size: 20px; font-weight: 600;">${heading}</h2>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.6;">${message}</p>
        
        <p style="margin: 0 0 24px 0; color: #666;">Here are the order details:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Invoice ID:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${orderId}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">$${order.total.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Customer's E-mail:</strong></td>
                <td style="padding: 8px 0; text-align: right;"><a href="mailto:${order.email}" style="color: #00d4ff;">${order.email}</a></td>
            </tr>
        </table>
        
        <p style="margin: 0 0 8px 0; color: #333; font-weight: 600;">Items:</p>
        ${itemsHtml}
    `

    return sendEmail({
        to: order.email,
        subject,
        html: wrapTemplate(content, storeName, invoiceUrl)
    })
}

/**
 * Send payment confirmed email
 */
export async function sendPaymentConfirmedEmail(order: Order, paymentAmount?: number, cryptoCurrency?: string) {
    if (!order.email) {
        console.log("[EMAIL] No email for order:", order.id)
        return
    }

    const settings = await getSiteSettings()
    const storeName = settings.general?.name || "Rainyday"
    const orderId = order.readable_id || order.id.slice(0, 8).toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://rainyday-new.vercel.app")
    const invoiceUrl = `${baseUrl}/invoice?id=${order.id}`

    // Get customizable template content
    const subjectTemplate = settings.email?.payment_subject || 'Payment Confirmed - Order #{order_id}'
    const headingTemplate = settings.email?.payment_heading || 'Payment Received! ✅'
    const messageTemplate = settings.email?.payment_message || 'Your payment has been confirmed. Your items are being delivered.'

    // Replace variables in templates
    const replaceVars = (template: string) => template
        .replace(/{order_id}/g, orderId)
        .replace(/{store_name}/g, storeName)
        .replace(/{email}/g, order.email || '')
        .replace(/{total}/g, `$${order.total.toFixed(2)}`)
        .replace(/{payment_method}/g, cryptoCurrency || 'Crypto')

    const subject = replaceVars(subjectTemplate)
    const heading = replaceVars(headingTemplate)
    const message = replaceVars(messageTemplate)

    const content = `
        <h2 style="margin: 0 0 16px 0; color: #333; font-size: 20px; font-weight: 600;">${heading}</h2>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.6;">${message}</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Invoice ID:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${orderId}</td>
            </tr>
            ${cryptoCurrency ? `
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${cryptoCurrency}</td>
            </tr>
            ` : ''}
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">$${order.total.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Customer's E-mail:</strong></td>
                <td style="padding: 8px 0; text-align: right;"><a href="mailto:${order.email}" style="color: #00d4ff;">${order.email}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #10b981; text-align: right; font-weight: 600;">Payment Confirmed ✓</td>
            </tr>
        </table>
    `

    return sendEmail({
        to: order.email,
        subject,
        html: wrapTemplate(content, storeName, invoiceUrl)
    })
}

/**
 * Send delivery completed email with items/deliverables
 */
export async function sendDeliveryCompletedEmail(order: Order, deliveredAssets: DeliveryAsset[]) {
    if (!order.email) {
        console.log("[EMAIL] No email for order:", order.id)
        return
    }

    const settings = await getSiteSettings()
    const storeName = settings.general?.name || "Rainyday"
    const orderId = order.readable_id || order.id.slice(0, 8).toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://rainyday-new.vercel.app")
    const invoiceUrl = order.delivery_url || `${baseUrl}/invoice?id=${order.id}`

    // Get customizable template content
    const subjectTemplate = settings.email?.delivery_subject || '🎉 Your Order is Delivered - #{order_id}'
    const headingTemplate = settings.email?.delivery_heading || 'Your Order is Delivered! 🚀'
    const messageTemplate = settings.email?.delivery_message || 'Thank you for your purchase. Your items are ready below.'

    // Replace variables in templates
    const replaceVars = (template: string) => template
        .replace(/{order_id}/g, orderId)
        .replace(/{store_name}/g, storeName)
        .replace(/{email}/g, order.email || '')
        .replace(/{total}/g, `$${order.total.toFixed(2)}`)

    const subject = replaceVars(subjectTemplate)
    const heading = replaceVars(headingTemplate)
    const message = replaceVars(messageTemplate)

    const hasAssets = deliveredAssets.length > 0

    // Build deliverables section with each item in a styled box
    const deliverablesHtml = hasAssets ? deliveredAssets.map((asset, i) => `
        <div style="margin-bottom: 16px; padding: 16px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${asset.product_name ? asset.product_name : `Deliverable ${i + 1}`}
            </p>
            <p style="margin: 0; color: #333; font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; background-color: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">
                ${asset.content}
            </p>
        </div>
    `).join("") : ""

    const content = `
        <h2 style="margin: 0 0 16px 0; color: #333; font-size: 20px; font-weight: 600;">${heading}</h2>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.6;">${message}</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Invoice ID:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${orderId}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0; color: #333; text-align: right;">$${order.total.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #10b981; text-align: right; font-weight: 600;">Delivered ✓</td>
            </tr>
        </table>
        
        ${hasAssets ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee;">
            <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px; font-weight: 600;">📦 Your Deliverables:</h3>
            ${deliverablesHtml}
        </div>
        ` : `
        <p style="margin: 24px 0 0 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534;">
            Your order has been marked as delivered. Check your invoice page for details.
        </p>
        `}
        
        <p style="margin: 24px 0 0 0; color: #999; font-size: 13px;">
            ⚠️ Please save your deliverables in a safe place. You can also view them anytime from your invoice page.
        </p>
    `

    return sendEmail({
        to: order.email,
        subject,
        html: wrapTemplate(content, storeName, invoiceUrl)
    })
}
