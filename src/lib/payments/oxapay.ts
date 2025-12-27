"use server"

const OXAPAY_API_URL = "https://api.oxapay.com"
const MERCHANT_API_KEY = process.env.OXAPAY_API_KEY

interface CreateInvoiceParams {
    amount: number
    currency?: string
    description?: string
    orderId: string
    email?: string
    callbackUrl?: string
    returnUrl?: string
    payCurrency?: string // BTC, ETH, LTC, etc.
}

interface WhiteLabelPaymentDetails {
    trackId: string
    address: string
    amount: string
    currency: string
    payCurrency: string
    qrCodeUrl: string
    expiresAt: number
    payLink: string
    isRedirect?: boolean
}

// Create a white-label invoice for embedded payment (no redirect)
export async function createOxaPayWhiteLabelInvoice(params: CreateInvoiceParams): Promise<WhiteLabelPaymentDetails> {
    if (!MERCHANT_API_KEY) {
        throw new Error("OXAPAY_API_KEY is not configured")
    }



    try {
        // Try legacy merchants/request/whitelabel endpoint
        const response = await fetch(`${OXAPAY_API_URL}/merchants/request/whitelabel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant: MERCHANT_API_KEY,
                amount: params.amount,
                currency: params.currency || "USD",
                payCurrency: params.payCurrency || "BTC",
                lifeTime: 60,
                feePaidByPayer: 0,
                underPaidCover: 2.5,
                callbackUrl: params.callbackUrl,
                returnUrl: params.returnUrl,
                description: params.description,
                orderId: params.orderId,
                email: params.email,
            }),
        })

        const data = await response.json()


        if (data.result !== 100) {
            console.error("OxaPay White-Label API Error:", data)
            // Fall back to regular invoice (redirects to OxaPay)

            const regularInvoice = await createOxaPayInvoice(params)
            return {
                trackId: regularInvoice.trackId,
                address: "",
                amount: String(params.amount),
                currency: params.currency || "USD",
                payCurrency: params.payCurrency || "BTC",
                qrCodeUrl: "",
                expiresAt: Date.now() + 60 * 60 * 1000,
                payLink: regularInvoice.payUrl,
                isRedirect: true, // Flag to indicate fallback to redirect
            }
        }

        return {
            trackId: data.trackId,
            address: data.address,
            amount: data.payAmount,
            currency: params.currency || "USD",
            payCurrency: data.payCurrency || params.payCurrency || "BTC",
            qrCodeUrl: data.qrcode,
            expiresAt: data.expiredAt,
            payLink: data.payLink,
            isRedirect: false,
        }
    } catch (error) {
        console.error("OxaPay White-Label Integration Error:", error)
        // Fall back to regular invoice on any error
        const regularInvoice = await createOxaPayInvoice(params)
        return {
            trackId: regularInvoice.trackId,
            address: "",
            amount: String(params.amount),
            currency: params.currency || "USD",
            payCurrency: params.payCurrency || "BTC",
            qrCodeUrl: "",
            expiresAt: Date.now() + 60 * 60 * 1000,
            payLink: regularInvoice.payUrl,
            isRedirect: true,
        }
    }
}

/**
 * Generate a static address for receiving crypto payments
 * This is the best way to achieve white-label - get a permanent address for display
 */
export async function generateOxaPayStaticAddress(params: {
    currency: string  // BTC, ETH, USDT, LTC, etc.
    network?: string  // Optional - network like TRC20, ERC20
    orderId?: string
    email?: string
    callbackUrl?: string
    description?: string
}) {
    if (!MERCHANT_API_KEY) {
        throw new Error("OXAPAY_API_KEY is not configured")
    }

    // Map common names to OxaPay currency codes
    const currencyMap: Record<string, string> = {
        "BTC": "BTC",
        "Bitcoin": "BTC",
        "ETH": "ETH",
        "Ethereum": "ETH",
        "LTC": "LTC",
        "Litecoin": "LTC",
        "XMR": "XMR",
        "Monero": "XMR",
        "USDT": "USDT"
    }

    const payCurrency = currencyMap[params.currency] || params.currency



    try {
        const response = await fetch(`${OXAPAY_API_URL}/merchants/request/staticaddress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant: MERCHANT_API_KEY,
                currency: payCurrency,
                network: params.network,
                orderId: params.orderId,
                email: params.email,
                callbackUrl: params.callbackUrl,
                description: params.description,
            }),
        })

        const data = await response.json()


        if (data.result !== 100) {
            console.error("OxaPay Static Address Error:", data)
            return null
        }

        return {
            address: data.address,
            currency: payCurrency,
            trackId: data.trackId,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.address || '')}`,
        }
    } catch (error) {
        console.error("OxaPay Static Address Error:", error)
        return null
    }
}

// Create a regular invoice - now includes payCurrency for address generation
export async function createOxaPayInvoice(params: CreateInvoiceParams) {
    if (!MERCHANT_API_KEY) {
        throw new Error("OXAPAY_API_KEY is not configured")
    }



    try {
        const response = await fetch(`${OXAPAY_API_URL}/merchants/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant: MERCHANT_API_KEY,
                amount: params.amount,
                currency: params.currency || "USD",
                payCurrency: params.payCurrency || "BTC", // IMPORTANT: Specify crypto for address generation
                lifeTime: 60,
                feePaidByPayer: 0,
                underPaidCover: 2.5,
                callbackUrl: params.callbackUrl,
                returnUrl: params.returnUrl,
                description: params.description,
                orderId: params.orderId,
                email: params.email,
            }),
        })

        const data = await response.json()


        if (data.result !== 100) {
            console.error("OxaPay API Error:", data)
            throw new Error(data.message || "Failed to create OxaPay invoice")
        }

        // Return all relevant fields from response
        return {
            payUrl: data.payLink,
            trackId: data.trackId,
            address: data.address || "", // Address may be included in response
            payAmount: data.payAmount || "",
            payCurrency: data.payCurrency || params.payCurrency || "BTC",
            expiredAt: data.expiredAt || Date.now() + 60 * 60 * 1000,
        }
    } catch (error) {
        console.error("OxaPay Integration Error:", error)
        throw error
    }
}

/**
 * Get payment information by trackId - returns address, QR code, status, etc.
 * This is the key to white-label - create a regular invoice, then get the details
 */
export async function getOxaPayPaymentInfo(trackId: string) {
    if (!MERCHANT_API_KEY) {
        throw new Error("OXAPAY_API_KEY is not configured")
    }

    try {
        const response = await fetch(`${OXAPAY_API_URL}/merchants/inquiry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant: MERCHANT_API_KEY,
                trackId: trackId,
            }),
        })

        const data = await response.json()

        console.log("[OxaPay Inquiry] Raw API Response:", JSON.stringify(data, null, 2))

        if (data.result !== 100) {
            console.error("OxaPay Payment Info Error:", data)
            return null
        }

        return {
            trackId: data.trackId,
            status: data.status, // "New", "Waiting", "Confirming", "Paid", "Expired", "Failed"
            amount: data.amount,
            currency: data.currency,
            payCurrency: data.payCurrency,
            payAmount: data.payAmount,
            address: data.address,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.address || '')}`,
            expiredAt: data.expiredAt,
            txID: data.txID,
            payLink: data.payLink,
        }
    } catch (error) {
        console.error("OxaPay Payment Info Error:", error)
        return null
    }
}

/**
 * Create white-label payment - Rainyday branded, no OxaPay UI
 * Priority: 1) Invoice address 2) Static address 3) Inquiry 4) PayLink as QR
 */
export async function createOxaPayWhiteLabelWithInquiry(params: CreateInvoiceParams): Promise<WhiteLabelPaymentDetails> {
    console.log("[OxaPay WhiteLabel] Starting with params:", params)

    // Step 0: Try the NEW v1 API endpoint - this is the correct white-label endpoint
    console.log("[OxaPay WhiteLabel] Step 0 - Trying v1 /payment/white-label endpoint")

    // Network mapping for OxaPay - required for address generation
    const networkMap: Record<string, string> = {
        "BTC": "Bitcoin",
        "ETH": "Ethereum",
        "LTC": "Litecoin",
        "TRX": "Tron",
        "DOGE": "Dogecoin",
        "BCH": "Bitcoin Cash",
        "BNB": "BSC",  // Binance Smart Chain / BEP20
        "SOL": "Solana",
        "XMR": "Monero",
        "USDT": "TRC20", // Default USDT to TRC20
        "USDC": "Polygon",
        "TON": "TON",
        "POL": "Polygon",
        "SHIB": "Ethereum",
        "DAI": "Ethereum",
        "NOT": "TON",
        "DOGS": "TON",
        "XRP": "Ripple",
    }

    const payCurrency = params.payCurrency || "BTC"
    const network = networkMap[payCurrency] || payCurrency

    try {
        const v1Response = await fetch(`${OXAPAY_API_URL}/v1/payment/white-label`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "merchant_api_key": MERCHANT_API_KEY!,
            },
            body: JSON.stringify({
                pay_currency: payCurrency,
                network: network,
                amount: params.amount,
                currency: params.currency || "USD",
                lifetime: 60,
                fee_paid_by_payer: 0,
                email: params.email,
                order_id: params.orderId,
                description: params.description,
                callback_url: params.callbackUrl,
            }),
        })


        const v1Data = await v1Response.json()
        console.log("[OxaPay WhiteLabel] Step 0 - v1 API Response:", JSON.stringify(v1Data, null, 2))

        // v1 API returns address directly on success
        if (v1Data.address) {
            console.log("[OxaPay WhiteLabel] SUCCESS - v1 API returned address!")
            return {
                trackId: v1Data.track_id || v1Data.trackId || "",
                address: v1Data.address,
                amount: v1Data.pay_amount || String(params.amount),
                currency: params.currency || "USD",
                payCurrency: v1Data.pay_currency || params.payCurrency || "BTC",
                qrCodeUrl: v1Data.qrcode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(v1Data.address)}`,
                expiresAt: v1Data.expired_at ? new Date(v1Data.expired_at * 1000).getTime() : Date.now() + 60 * 60 * 1000,
                payLink: v1Data.pay_link || "",
                isRedirect: false,
            }
        }
        console.log("[OxaPay WhiteLabel] Step 0 - v1 API failed or no address, error:", v1Data.message || v1Data.error)
    } catch (v1Error) {
        console.error("[OxaPay WhiteLabel] Step 0 - v1 API Error:", v1Error)
    }

    // Step 0b: Also try legacy endpoint as fallback
    console.log("[OxaPay WhiteLabel] Step 0b - Trying legacy /merchants/request/whitelabel endpoint")
    try {
        const legacyResponse = await fetch(`${OXAPAY_API_URL}/merchants/request/whitelabel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant: MERCHANT_API_KEY,
                amount: params.amount,
                currency: params.currency || "USD",
                payCurrency: params.payCurrency || "BTC",
                lifeTime: 60,
                feePaidByPayer: 0,
                underPaidCover: 2.5,
                callbackUrl: params.callbackUrl,
                returnUrl: params.returnUrl,
                description: params.description,
                orderId: params.orderId,
                email: params.email,
            }),
        })

        const legacyData = await legacyResponse.json()
        console.log("[OxaPay WhiteLabel] Step 0b - Legacy Response:", JSON.stringify(legacyData, null, 2))

        if (legacyData.result === 100 && legacyData.address) {
            console.log("[OxaPay WhiteLabel] SUCCESS - Legacy endpoint returned address!")
            return {
                trackId: legacyData.trackId,
                address: legacyData.address,
                amount: legacyData.payAmount || String(params.amount),
                currency: params.currency || "USD",
                payCurrency: legacyData.payCurrency || params.payCurrency || "BTC",
                qrCodeUrl: legacyData.qrcode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(legacyData.address)}`,
                expiresAt: legacyData.expiredAt || Date.now() + 60 * 60 * 1000,
                payLink: legacyData.payLink || "",
                isRedirect: false,
            }
        }
        console.log("[OxaPay WhiteLabel] Step 0b - Legacy failed, trying other fallbacks...")
    } catch (legacyError) {
        console.error("[OxaPay WhiteLabel] Step 0b - Legacy Error:", legacyError)
    }

    // Step 1: Create regular invoice (for payLink fallback)
    const invoice = await createOxaPayInvoice(params)
    console.log("[OxaPay WhiteLabel] Step 1 - Invoice created:", invoice)


    // Check if invoice response already contains address
    if (invoice.address) {
        console.log("[OxaPay WhiteLabel] SUCCESS - Invoice has address!")
        return {
            trackId: invoice.trackId,
            address: invoice.address,
            amount: invoice.payAmount || String(params.amount),
            currency: params.currency || "USD",
            payCurrency: invoice.payCurrency,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoice.address)}`,
            expiresAt: invoice.expiredAt,
            payLink: invoice.payUrl,
            isRedirect: false,
        }
    }

    // Step 2: Try static address as backup
    console.log("[OxaPay WhiteLabel] Step 2 - Trying static address for:", params.payCurrency || "BTC")
    const staticAddress = await generateOxaPayStaticAddress({
        currency: params.payCurrency || "BTC",
        orderId: params.orderId,
        email: params.email,
        callbackUrl: params.callbackUrl,
        description: params.description,
    })
    console.log("[OxaPay WhiteLabel] Step 2 - Static address result:", staticAddress)

    if (staticAddress && staticAddress.address) {
        console.log("[OxaPay WhiteLabel] SUCCESS - Static address generated!")
        return {
            trackId: staticAddress.trackId || invoice.trackId,
            address: staticAddress.address,
            amount: String(params.amount),
            currency: params.currency || "USD",
            payCurrency: staticAddress.currency,
            qrCodeUrl: staticAddress.qrCodeUrl,
            expiresAt: Date.now() + 60 * 60 * 1000,
            payLink: invoice.payUrl,
            isRedirect: false,
        }
    }

    // Step 3: Query inquiry endpoint with retries (3s delay between)
    console.log("[OxaPay WhiteLabel] Step 3 - Starting inquiry polling for trackId:", invoice.trackId)
    for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        console.log(`[OxaPay WhiteLabel] Step 3 - Inquiry attempt ${attempt + 1}/5`)

        const paymentInfo = await getOxaPayPaymentInfo(invoice.trackId)
        console.log(`[OxaPay WhiteLabel] Step 3 - Inquiry result:`, paymentInfo?.address ? "HAS ADDRESS" : "No address yet")

        if (paymentInfo && paymentInfo.address) {
            console.log("[OxaPay WhiteLabel] SUCCESS - Inquiry returned address!")
            return {
                trackId: paymentInfo.trackId,
                address: paymentInfo.address,
                amount: paymentInfo.payAmount || String(params.amount),
                currency: params.currency || "USD",
                payCurrency: paymentInfo.payCurrency,
                qrCodeUrl: paymentInfo.qrCodeUrl,
                expiresAt: paymentInfo.expiredAt,
                payLink: paymentInfo.payLink || invoice.payUrl,
                isRedirect: false,
            }
        }
    }

    // Step 4: Last resort - display QR code for payLink (user scans and goes to OxaPay)
    console.log("[OxaPay WhiteLabel] FALLBACK - No address obtained, using payLink QR")
    console.log("[OxaPay WhiteLabel] payUrl:", invoice.payUrl)

    return {
        trackId: invoice.trackId,
        address: "", // No crypto address available
        amount: String(params.amount),
        currency: params.currency || "USD",
        payCurrency: params.payCurrency || "BTC",
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoice.payUrl)}`,
        expiresAt: Date.now() + 60 * 60 * 1000,
        payLink: invoice.payUrl,
        isRedirect: false, // Still no redirect - show QR on page
    }
}

/**
 * Verify OxaPay signature for webhooks
 */
export async function verifyOxaPaySignature(body: string, signature: string) {
    if (!MERCHANT_API_KEY) return false

    const crypto = await import("crypto")
    const hmac = crypto.createHmac("sha512", MERCHANT_API_KEY)
    hmac.update(body)
    const expectedSignature = hmac.digest("hex")

    return expectedSignature === signature
}
