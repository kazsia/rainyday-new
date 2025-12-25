import { Suspense } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, CircleAlert, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  verifyDeliveryToken,
  logDeliveryAccess
} from "@/lib/security/delivery-tokens"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { RateLimits, rateLimitKey } from "@/lib/security/rate-limit-config"
import { headers } from "next/headers"
import { DeliveryContent } from "./delivery-content"
import { FeedbackForm } from "@/components/feedback/feedback-form"

interface DeliveryPageProps {
  searchParams: Promise<{ token?: string; orderId?: string }>
}

// Simple headless browser detection
function isHeadlessBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  const headlessIndicators = ['headless', 'puppeteer', 'playwright', 'selenium', 'phantomjs', 'electron', 'bot', 'crawler', 'spider']
  return headlessIndicators.some(h => ua.includes(h))
}

async function DeliveryPageContent({ searchParams }: DeliveryPageProps) {
  const params = await searchParams
  const token = params.token
  const headersList = await headers()
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"

  // ========================
  // SECURITY: Rate Limiting
  // ========================
  const rateKey = rateLimitKey("delivery", ipAddress)
  const rateResult = await checkRateLimit(rateKey, RateLimits.DELIVERY.limit, RateLimits.DELIVERY.windowMs)

  if (!rateResult.allowed) {
    const retryAfter = Math.ceil((rateResult.resetAt - Date.now()) / 1000 / 60)
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-500 mb-2">Too Many Requests</h2>
              <p className="text-yellow-500/80">Please wait {retryAfter} minutes before trying again.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // ========================
  // SECURITY: Bot Detection
  // ========================
  if (isHeadlessBrowser(userAgent)) {
    await logDeliveryAccess("unknown", token || "no-token", false, ipAddress, userAgent, "Bot detected")
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Access Denied"
            message="Automated access is not permitted."
          />
        </div>
      </MainLayout>
    )
  }

  // ========================
  // VALIDATION: Token Required
  // ========================
  if (!token) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Invalid Access"
            message="A valid delivery token is required to access this page."
          />
        </div>
      </MainLayout>
    )
  }

  // ========================
  // VALIDATION: Verify Token
  // ========================
  const verification = await verifyDeliveryToken(token, true)

  if (!verification.valid || !verification.payload) {
    await logDeliveryAccess(
      "unknown",
      token,
      false,
      ipAddress,
      userAgent,
      verification.error
    )

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Access Denied"
            message={getErrorMessage(verification.error)}
          />
        </div>
      </MainLayout>
    )
  }

  const { orderId, email } = verification.payload

  // ========================
  // VALIDATION: Order Exists & Matches
  // ========================
  const supabase = await createClient()
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      email,
      status,
      total,
      readable_id,
      created_at,
      order_items (
        id,
        quantity,
        price,
        product_id,
        products (
          name,
          delivery_type
        )
      )
    `)
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    await logDeliveryAccess(orderId, token, false, ipAddress, userAgent, "Order not found")
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Order Not Found"
            message="The order associated with this delivery could not be found."
          />
        </div>
      </MainLayout>
    )
  }

  // ========================
  // VALIDATION: Email Matches
  // ========================
  if (order.email?.toLowerCase() !== email.toLowerCase()) {
    await logDeliveryAccess(orderId, token, false, ipAddress, userAgent, "Email mismatch")
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Access Denied"
            message="You are not authorized to access this delivery."
          />
        </div>
      </MainLayout>
    )
  }

  // ========================
  // VALIDATION: Order is Paid/Delivered
  // ========================
  if (!["paid", "delivered", "completed"].includes(order.status)) {
    await logDeliveryAccess(orderId, token, false, ipAddress, userAgent, `Invalid status: ${order.status}`)
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ErrorCard
            title="Order Not Ready"
            message="This order has not been paid yet or is still being processed."
          />
        </div>
      </MainLayout>
    )
  }

  // ========================
  // FETCH DELIVERY CONTENT
  // ========================
  const { data: delivery } = await supabase
    .from("deliveries")
    .select("*")
    .eq("order_id", orderId)
    .single()

  // Log successful access
  await logDeliveryAccess(orderId, token, true, ipAddress, userAgent)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black mb-4">Secure Delivery</h1>
          <p className="text-muted-foreground text-lg">
            Your digital product is ready. Please reveal and save your access details.
          </p>
        </div>

        <div className="space-y-8">
          {/* Warning Card */}
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-6 flex gap-4">
              <CircleAlert className="w-6 h-6 text-yellow-500 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-yellow-500">One-Time Reveal</h4>
                <p className="text-sm text-yellow-500/80">
                  For security reasons, this content can only be revealed once. Please make sure to copy or download your product details immediately.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Order #{order.readable_id || orderId.substring(0, 8)}
                </CardTitle>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {order.status === "delivered" ? "Ready" : "Paid"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{order.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">${order.total?.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Content - Client Component for Reveal */}
          <DeliveryContent
            orderId={orderId}
            token={token}
            delivery={delivery}
            orderItems={order.order_items}
          />

          {/* Feedback Section */}
          <div className="pt-12 space-y-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(38,188,196,0.5)]" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Rate Your Delivery</h2>
            </div>
            <FeedbackForm invoiceId={orderId} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="bg-red-500/5 border-red-500/20">
      <CardContent className="p-8 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-500 mb-4">
          <CircleAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-red-500 mb-2">{title}</h2>
        <p className="text-red-500/80">{message}</p>
      </CardContent>
    </Card>
  )
}

function getErrorMessage(error?: string): string {
  switch (error) {
    case "Token expired":
      return "This delivery link has expired. Please contact support for a new link."
    case "Token already used":
      return "This delivery link has already been used. For security, each link can only be used once."
    case "Invalid signature":
    case "Invalid token format":
      return "This delivery link is invalid or has been tampered with."
    default:
      return "Unable to verify this delivery link. Please contact support."
  }
}

export default function DeliveryPage(props: DeliveryPageProps) {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <div className="animate-pulse">Loading delivery...</div>
        </div>
      </MainLayout>
    }>
      <DeliveryPageContent {...props} />
    </Suspense>
  )
}
