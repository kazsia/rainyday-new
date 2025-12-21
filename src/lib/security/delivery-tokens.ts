"use server"

import { createAdminClient } from "@/lib/supabase/server"
import * as crypto from "crypto"

const DELIVERY_SECRET = process.env.DELIVERY_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-change-me"
const TOKEN_EXPIRY_HOURS = 72 // 3 days

interface DeliveryTokenPayload {
    orderId: string
    email: string
    exp: number
    iat: number
    jti: string // Unique token ID for single-use tracking
}

/**
 * Generate a signed delivery token for secure product access.
 * Token is time-limited and can be marked as single-use.
 */
export async function generateDeliveryToken(
    orderId: string,
    email: string,
    expiresInHours: number = TOKEN_EXPIRY_HOURS
): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const jti = crypto.randomUUID()

    const payload: DeliveryTokenPayload = {
        orderId,
        email: email.toLowerCase(),
        iat: now,
        exp: now + (expiresInHours * 60 * 60),
        jti
    }

    // Create signature
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
    const signature = crypto
        .createHmac("sha256", DELIVERY_SECRET)
        .update(payloadBase64)
        .digest("base64url")

    return `${payloadBase64}.${signature}`
}

/**
 * Verify a delivery token and return the payload.
 * Checks signature, expiration, and optionally single-use status.
 */
export async function verifyDeliveryToken(
    token: string,
    checkSingleUse: boolean = true
): Promise<{ valid: boolean; payload?: DeliveryTokenPayload; error?: string }> {
    try {
        const parts = token.split(".")
        if (parts.length !== 2) {
            return { valid: false, error: "Invalid token format" }
        }

        const [payloadBase64, signature] = parts

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", DELIVERY_SECRET)
            .update(payloadBase64)
            .digest("base64url")

        if (signature !== expectedSignature) {
            return { valid: false, error: "Invalid signature" }
        }

        // Decode payload
        const payload: DeliveryTokenPayload = JSON.parse(
            Buffer.from(payloadBase64, "base64url").toString()
        )

        // Check expiration
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp < now) {
            return { valid: false, error: "Token expired" }
        }

        // Check single-use (if enabled)
        if (checkSingleUse) {
            const supabase = await createAdminClient()
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

            const { data: existing } = await supabase
                .from("delivery_access_logs")
                .select("id, revealed")
                .eq("token_hash", tokenHash)
                .single()

            if (existing?.revealed) {
                return { valid: false, error: "Token already used" }
            }
        }

        return { valid: true, payload }
    } catch (error) {
        console.error("Token verification error:", error)
        return { valid: false, error: "Token verification failed" }
    }
}

/**
 * Mark a delivery token as used (for single-use tokens).
 * Call this after the user reveals the content.
 */
export async function markTokenUsed(
    token: string,
    orderId: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    const supabase = await createAdminClient()
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    await supabase.from("delivery_access_logs").upsert({
        order_id: orderId,
        token_hash: tokenHash,
        revealed: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        accessed_at: new Date().toISOString()
    }, {
        onConflict: "token_hash"
    })
}

/**
 * Log delivery access attempt (for audit trail).
 */
export async function logDeliveryAccess(
    orderId: string,
    token: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorReason?: string
): Promise<void> {
    const supabase = await createAdminClient()
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    await supabase.from("audit_logs").insert({
        admin_id: null, // Not an admin action
        action: success ? "delivery_access" : "delivery_access_denied",
        target_table: "orders",
        target_id: orderId,
        details: {
            token_hash_prefix: tokenHash.substring(0, 8),
            ip_address: ipAddress,
            user_agent: userAgent?.substring(0, 200),
            error: errorReason
        }
    })
}

/**
 * Generate a delivery URL with token.
 */
export async function generateDeliveryUrl(token: string, baseUrl?: string): Promise<string> {
    const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    return `${base}/delivery?token=${encodeURIComponent(token)}`
}
