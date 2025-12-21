import { NextRequest, NextResponse } from "next/server"
import { verifyDeliveryToken, markTokenUsed } from "@/lib/security/delivery-tokens"
import { headers } from "next/headers"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { token, orderId } = body

        if (!token || !orderId) {
            return NextResponse.json(
                { message: "Missing token or orderId" },
                { status: 400 }
            )
        }

        // Verify token
        const verification = await verifyDeliveryToken(token, false) // Don't check single-use yet

        if (!verification.valid) {
            return NextResponse.json(
                { message: verification.error || "Invalid token" },
                { status: 403 }
            )
        }

        // Verify orderId matches
        if (verification.payload?.orderId !== orderId) {
            return NextResponse.json(
                { message: "Token does not match order" },
                { status: 403 }
            )
        }

        // Get request metadata
        const headersList = await headers()
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined
        const userAgent = headersList.get("user-agent") || undefined

        // Mark token as used
        await markTokenUsed(token, orderId, ipAddress, userAgent)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delivery reveal error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
