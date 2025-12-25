"use server"

import { getSiteSettings } from "@/lib/db/settings"

interface DiscordEmbed {
    title: string
    description?: string
    color?: number
    fields?: { name: string; value: string; inline?: boolean }[]
    footer?: { text: string; icon_url?: string }
    timestamp?: string
    thumbnail?: { url: string }
    url?: string
}

/**
 * Send a message to the configured Discord webhook.
 */
async function sendDiscordWebhook(embeds: DiscordEmbed[]): Promise<boolean> {
    try {
        const settings = await getSiteSettings()
        const webhookUrl = settings.notifications?.webhook_url

        if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
            console.log('[Discord] No valid webhook URL configured')
            return false
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds })
        })

        if (!response.ok) {
            console.error('[Discord] Webhook failed:', response.status, await response.text())
            return false
        }

        return true
    } catch (error) {
        console.error('[Discord] Webhook error:', error)
        return false
    }
}

interface SaleDetails {
    orderId: string
    orderReadableId: string
    total: number
    email: string
    cryptoAmount?: string
    cryptoCurrency?: string
    paymentMethod?: string
    products?: Array<{
        name: string
        quantity: number
        price: number
        variant?: string
    }>
}

/**
 * Send an enhanced sale notification to Discord.
 */
export async function notifyDiscordSale(
    orderId: string,
    orderReadableId: string,
    total: number,
    email: string,
    cryptoAmount?: string,
    cryptoCurrency?: string,
    paymentMethod?: string,
    products?: Array<{ name: string; quantity: number; price: number; variant?: string }>,
    customFields?: Record<string, any>
): Promise<void> {
    try {
        const settings = await getSiteSettings()
        const storeName = settings.general?.name || "Rainyday"
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rainyday.cc"

        // Check if sale notifications are enabled
        if (!settings.notifications?.notify_on_sale) {
            return
        }

        const isHighValue = total >= 100
        const color = isHighValue ? 0xFFD700 : 0x26BCC4 // Gold for high value, brand cyan for normal

        const displayOrderId = orderReadableId || orderId.slice(0, 8).toUpperCase()
        const invoiceUrl = `${baseUrl}/admin/invoices/${orderId}`

        // Build product list
        let productsText = ''
        if (products && products.length > 0) {
            productsText = products.map(p =>
                `• ${p.name}${p.variant ? ` (${p.variant})` : ''} x${p.quantity} - $${p.price.toFixed(2)}`
            ).join('\n')
        }

        const fields = [
            {
                name: '📧 Customer',
                value: `\`${email}\``,
                inline: true
            },
            {
                name: '💵 Total',
                value: `**$${total.toFixed(2)} USD**`,
                inline: true
            }
        ]

        // Payment method
        if (paymentMethod || cryptoCurrency) {
            fields.push({
                name: '💳 Payment Method',
                value: paymentMethod || cryptoCurrency || 'Crypto',
                inline: true
            })
        }

        // Crypto amount
        if (cryptoAmount && cryptoCurrency) {
            fields.push({
                name: '₿ Crypto Amount',
                value: `\`${cryptoAmount} ${cryptoCurrency}\``,
                inline: true
            })
        }

        // Order ID
        fields.push({
            name: '🆔 Invoice ID',
            value: `\`${displayOrderId}\``,
            inline: true
        })

        // Products
        if (productsText) {
            fields.push({
                name: '📦 Products',
                value: productsText.length > 1024 ? productsText.slice(0, 1021) + '...' : productsText,
                inline: false
            })
        }

        // Custom Fields
        if (customFields && Object.keys(customFields).length > 0) {
            const customFieldsText = Object.entries(customFields)
                .map(([key, value]) => `• **${key.split('_').pop()}**: ${value}`)
                .join('\n')

            if (customFieldsText) {
                fields.push({
                    name: '📝 Custom Fields',
                    value: customFieldsText.length > 1024 ? customFieldsText.slice(0, 1021) + '...' : customFieldsText,
                    inline: false
                })
            }
        }

        // Invoice URL
        fields.push({
            name: '🔗 Invoice Link',
            value: `[View Invoice](${invoiceUrl})`,
            inline: false
        })

        await sendDiscordWebhook([{
            title: isHighValue ? '💰 High-Value Sale!' : '🛒 New Sale',
            description: isHighValue
                ? `A high-value order has been completed on **${storeName}**!`
                : `A new order has been paid and delivered on **${storeName}**.`,
            color,
            fields,
            footer: {
                text: `${storeName} • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            },
            timestamp: new Date().toISOString()
        }])
    } catch (error) {
        console.error('[Discord] Sale notification failed:', error)
    }
}

/**
 * Send a ticket notification to Discord.
 */
export async function notifyDiscordTicket(
    ticketId: string,
    email: string,
    subject: string
): Promise<void> {
    try {
        const settings = await getSiteSettings()
        const storeName = settings.general?.name || "Rainyday"
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rainyday.cc"

        // Check if ticket notifications are enabled
        if (!settings.notifications?.notify_on_ticket) {
            return
        }

        const ticketUrl = `${baseUrl}/admin/tickets`

        await sendDiscordWebhook([{
            title: '🎫 New Support Ticket',
            description: `A customer has opened a new support ticket on **${storeName}**.`,
            color: 0xFFA500, // Orange
            fields: [
                { name: '📧 Customer', value: `\`${email}\``, inline: true },
                { name: '📝 Subject', value: subject || 'No subject', inline: true },
                { name: '🆔 Ticket ID', value: `\`${ticketId.slice(0, 8).toUpperCase()}\``, inline: true },
                { name: '🔗 View Tickets', value: `[Open Dashboard](${ticketUrl})`, inline: false }
            ],
            footer: {
                text: `${storeName} Support • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            },
            timestamp: new Date().toISOString()
        }])
    } catch (error) {
        console.error('[Discord] Ticket notification failed:', error)
    }
}
