"use server"

const PAYLIX_API_URL = "https://dev.paylix.gg/v1"
const API_KEY = process.env.PAYLIX_API_KEY
const MERCHANT_NAME = process.env.PAYLIX_MERCHANT_NAME

interface CreatePaymentParams {
    title: string
    value: number
    currency: string
    email: string
    quantity?: number
    white_label?: boolean
    return_url?: string
    webhook?: string
    product_id?: string | null
    gateway?: string | null
}

export async function createPaylixPayment(params: CreatePaymentParams) {
    if (!API_KEY) {
        throw new Error("PAYLIX_API_KEY is not configured")
    }

    try {
        const headers: Record<string, string> = {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        }

        if (MERCHANT_NAME) {
            headers["X-Paylix-Merchant"] = MERCHANT_NAME
        }

        const response = await fetch(`${PAYLIX_API_URL}/payments`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                title: params.title,
                value: params.value,
                currency: params.currency || "USD",
                quantity: params.quantity || 1,
                email: params.email,
                white_label: params.white_label || false,
                return_url: params.return_url,
                webhook: params.webhook,
                product_id: params.product_id || null,
                gateway: params.gateway || null,
            }),
        })

        const text = await response.text()
        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error("Paylix API returned non-JSON response:", text)
            throw new Error(`Paylix API Error (Invalid JSON): ${text.substring(0, 100)}...`)
        }

        if (data.status !== 200) {
            console.error("Paylix API Error:", data)
            throw new Error(data.message || "Failed to create Paylix payment")
        }

        return {
            url: data.data.url,
            uniqid: data.data.uniqid,
        }
    } catch (error) {
        console.error("Paylix Integration Error:", error)
        throw error
    }
}

/**
 * Verify Paylix signature for webhooks (HMAC-SHA512)
 */
export async function verifyPaylixSignature(body: string, signature: string) {
    const secret = process.env.PAYLIX_WEBHOOK_SECRET
    if (!secret) return false

    const crypto = await import("crypto")
    const expectedSignature = crypto
        .createHmac("sha512", secret)
        .update(body)
        .digest("hex")

    return expectedSignature === signature
}
