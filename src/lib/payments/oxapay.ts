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
    network?: string     // TRC20, ERC20, etc.
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
/**
 * Get payment information by trackId - returns address, QR code, status, etc.
 * Uses V1 endpoint: GET /v1/payment/{track_id}
 */
export async function getOxaPayPaymentInfo(trackId: string) {
    if (!MERCHANT_API_KEY) {
        console.error("[OxaPay] OXAPAY_API_KEY is not configured")
        return null
    }

    if (!trackId) {
        console.error("[OxaPay] No trackId provided")
        return null
    }

    try {
        const response = await fetch(`${OXAPAY_API_URL}/v1/payment/${trackId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "merchant_api_key": MERCHANT_API_KEY,
            },
        })

        if (!response.ok) {
            console.error("[OxaPay Inquiry] HTTP Error:", response.status, response.statusText)
            return null
        }

        const data = await response.json()
        console.log("[OxaPay Inquiry] Raw API Response:", JSON.stringify(data, null, 2))

        if (data.status !== 200 || !data.data) {
            console.error("OxaPay Payment Info Error (V1):", data)
            return null
        }

        const info = data.data

        // Normalize status to Title Case to match existing app logic
        // Official V1 Statuses: new, waiting, paying, paid, manual_accept, underpaid, refunding, refunded, expired
        const normalizeStatus = (s: string) => {
            if (!s) return "Unknown"
            const lower = s.toLowerCase()

            if (lower === "paid") return "Paid"
            if (lower === "manual_accept") return "Paid" // Treat manual acceptance as Paid
            if (lower === "confirming") return "Confirming" // Legacy/Observed
            if (lower === "paying") return "Confirming" // Map 'paying' to 'Confirming' for UI continuity
            if (lower === "waiting") return "Waiting"
            if (lower === "new") return "New"
            if (lower === "expired") return "Expired"
            if (lower === "underpaid") return "Underpaid"
            if (lower === "refunding") return "Refunding"
            if (lower === "refunded") return "Refunded"
            if (lower === "failed") return "Failed"

            return s.charAt(0).toUpperCase() + s.slice(1)
        }

        const normalizedStatus = normalizeStatus(info.status)

        // V1 returns transactions array: txs: [{ tx_hash: "..." }]
        const txID = (info.txs && info.txs.length > 0) ? info.txs[0].tx_hash : undefined

        return {
            trackId: info.track_id,
            status: normalizedStatus,
            amount: info.amount,
            currency: info.currency,
            payCurrency: info.pay_currency,
            payAmount: info.pay_amount,
            address: info.address,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(info.address || '')}`,
            expiredAt: info.expired_at ? info.expired_at * 1000 : undefined, // V1 is unix seconds
            txID: txID,
            payLink: "", // V1 info doesn't seem to return payLink usually, but we have address
        }
    } catch (error) {
        console.error("OxaPay Payment Info Error:", error)
        return null
    }
}

/**
 * Get list of static addresses, optionally filtered by orderId
 * Useful to check if we already generated one for this order
 */
export async function getOxaPayStaticAddressList(params: { orderId?: string, page?: number, size?: number }) {
    if (!MERCHANT_API_KEY) return null

    try {
        const url = new URL(`${OXAPAY_API_URL}/v1/payment/static-address`)
        url.searchParams.append("merchant_api_key", MERCHANT_API_KEY)
        if (params.orderId) url.searchParams.append("order_id", params.orderId)
        if (params.page) url.searchParams.append("page", params.page.toString())
        if (params.size) url.searchParams.append("size", params.size.toString())

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })

        const data = await response.json()
        if (data.status === 200 && data.data && data.data.list) {
            return data.data.list
        }
        return []
    } catch (error) {
        console.error("[OxaPay Static List] Error:", error)
        return []
    }
}

/**
 * Create white-label payment - Rainyday branded, no OxaPay UI
 * Priority: 1) Invoice address 2) Static address 3) Inquiry 4) PayLink as QR
 */
/**
 * Create white-label payment - Rainyday branded, no OxaPay UI
 * Uses the v1/payment/white-label endpoint
 */
export async function createOxaPayWhiteLabel(params: CreateInvoiceParams): Promise<WhiteLabelPaymentDetails> {
    console.log("[OxaPay WhiteLabel] Creating white-label invoice:", params)

    if (!MERCHANT_API_KEY) {
        throw new Error("OXAPAY_API_KEY is not configured")
    }

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
        "XMR": "XMR",
        "USDT": "TRC20", // Default USDT to TRC20
        "USDC": "Polygon",
        "TON": "TON",
        "POL": "Polygon",
        "SHIB": "Ethereum",
        "DAI": "Ethereum",
        "NOT": "TON",
        "DOGS": "TON",
        "XRP": "XRP",
    }

    const payCurrency = params.payCurrency || "BTC"

    // Normalize network names
    const networkAliasMap: Record<string, string> = {
        "BEP20": "BSC",
        "ERC20": "Ethereum",
        "TRC20": "Tron", // OxaPay often accepts TRC20 directly but 'Tron' is safer
        "SPL": "Solana",
        "ETH": "Ethereum",
        "Base": "Base",
        "Polygon": "Polygon"
    }

    // Determine network: Explicit param -> Alias -> Default from Currency -> Currency itself
    const network = networkAliasMap[params.network || ""] || params.network || networkMap[payCurrency] || payCurrency

    // 1. Try V1 White-Label Endpoint
    try {
        console.log(`[OxaPay WhiteLabel] Attempt 1: V1 API (Network: ${network})`)
        const response = await fetch(`${OXAPAY_API_URL}/v1/payment/white-label`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "merchant_api_key": MERCHANT_API_KEY,
            },
            body: JSON.stringify({
                amount: params.amount,
                currency: params.currency || "USD",
                pay_currency: params.payCurrency || "BTC",
                network: network,
                // life_time vs lifetime: Docs say both? Using life_time for V1 based on recent check, but safety in numbers.
                life_time: 60,
                lifetime: 60,
                fee_paid_by_payer: 0,
                under_paid_coverage: 2.5,
                callback_url: params.callbackUrl,
                return_url: params.returnUrl,
                description: params.description,
                order_id: params.orderId,
                email: params.email,
            }),
        })

        const data = await response.json()

        if (data.status === 200 && data.data) {
            const result = data.data
            // Ensure we have an address
            if (result.address) {
                console.log("[OxaPay WhiteLabel] Success via V1 API")
                return {
                    trackId: result.track_id,
                    address: result.address,
                    amount: result.pay_amount || String(params.amount),
                    currency: result.currency || "USD",
                    payCurrency: result.pay_currency,
                    qrCodeUrl: result.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(result.address)}`,
                    expiresAt: result.expired_at ? result.expired_at * 1000 : Date.now() + 60 * 60 * 1000,
                    payLink: "",
                    isRedirect: false,
                }
            }
        }
        console.warn("[OxaPay WhiteLabel] V1 API did not return address:", data.message)
    } catch (error) {
        console.error("[OxaPay WhiteLabel] V1 API failed:", error)
    }



    // 2. Fallback: Static Address (Smart Check & Create)
    try {
        console.log("[OxaPay WhiteLabel] Attempt 2: Static Address (Check & Create)")

        // A. Check for existing static address for this Order ID to avoid duplicates
        // Only if we have a valid Order ID
        if (params.orderId) {
            const existingList = await getOxaPayStaticAddressList({ orderId: params.orderId })
            // Find one that matches our requested currency/network if possible?
            // The list should filter by orderId so likely relevant.
            if (existingList && existingList.length > 0) {
                // Sort by date desc (assuming higher date is newer)
                const sorted = existingList.sort((a: any, b: any) => b.date - a.date)
                const latest = sorted[0]

                console.log("[OxaPay WhiteLabel] Found existing static address")
                return {
                    trackId: latest.track_id,
                    address: latest.address,
                    amount: String(params.amount), // Static addresses don't store amount, so use requested
                    currency: params.currency || "USD",
                    payCurrency: params.payCurrency || "BTC", // Use requested, assume it matches
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(latest.address)}`,
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Long expiry for static
                    payLink: "",
                    isRedirect: false
                }
            }
        }

        // B. Create New Static Address if none found
        const staticAddress = await generateOxaPayStaticAddress({
            currency: params.payCurrency || "BTC",
            network: network,
            orderId: params.orderId,
            email: params.email,
            callbackUrl: params.callbackUrl,
            description: params.description,
        })

        if (staticAddress && staticAddress.address) {
            console.log("[OxaPay WhiteLabel] Success via New Static Address")
            return {
                trackId: staticAddress.trackId,
                address: staticAddress.address,
                amount: String(params.amount),
                currency: params.currency || "USD",
                payCurrency: staticAddress.currency || params.payCurrency || "BTC",
                qrCodeUrl: staticAddress.qrCodeUrl,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                payLink: "",
                isRedirect: false
            }
        }
    } catch (e) { console.error("[OxaPay Static Fallback Error]", e) }

    // 3. Fallback: Standard Invoice + Address Extraction (The verified "Inquiry" method)
    try {
        console.log("[OxaPay WhiteLabel] Attempt 3: Invoice + Inquiry (Polled extraction)")

        // Create regular invoice
        const invoice = await createOxaPayInvoice(params)

        // If invoice already has address (some legacy endpoints return it)
        if (invoice.address) {
            console.log("[OxaPay WhiteLabel] Success via Invoice (Direct Address)")
            return {
                trackId: invoice.trackId,
                address: invoice.address,
                amount: String(invoice.payAmount),
                currency: params.currency || "USD",
                payCurrency: invoice.payCurrency,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoice.address)}`,
                expiresAt: invoice.expiredAt,
                payLink: invoice.payUrl,
                isRedirect: false
            }
        }

        // If no address, poll inquiry endpoint
        console.log("[OxaPay WhiteLabel] Polling inquiry for address...")
        for (let i = 0; i < 3; i++) {
            // Wait 1s
            await new Promise(r => setTimeout(r, 1000))
            const info = await getOxaPayPaymentInfo(invoice.trackId)
            if (info && info.address) {
                console.log("[OxaPay WhiteLabel] Success via Inquiry Polling")
                return {
                    trackId: invoice.trackId,
                    address: info.address,
                    amount: String(info.payAmount || invoice.payAmount),
                    currency: params.currency || "USD",
                    payCurrency: info.payCurrency || invoice.payCurrency,
                    qrCodeUrl: info.qrCodeUrl,
                    expiresAt: info.expiredAt || invoice.expiredAt,
                    payLink: invoice.payUrl,
                    isRedirect: false
                }
            }
        }

        // 4. Force Static Address as last resort if Inquiry fails?
        // Reuse the static address logic if available?
        // Or just fail.

        // 5. Absolute Last Resort: Return Invoice but NO redirect.
        // We throw error because "dont redirect" is strict.
        // OR we return the payLink but isRedirect: false, and the UI will show QR code for the LINK?
        // The UI (checkout page) handles `qrCodeUrl`. If we set `address` to empty, UI says "Error generating address".
        // We must error out.
        throw new Error("Could not generate a white-label address. Please try a different payment method or network.")

    } catch (error: any) {
        console.error("OxaPay White-Label Final Error:", error)
        throw new Error(error.message || "Payment generation failed")
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
