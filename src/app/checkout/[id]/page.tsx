"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Bitcoin,
  CreditCard,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Copy,
  QrCode,
  CheckCircle2,
  Star,
  Wallet2,
  Lock,
  Clock,
  Search,
  ChevronRight,
  CircleSlash,
  LockKeyhole,
  User,
  Mail,
  CircleAlert,
  Minus,
  Plus,
  Trash2,
  FileText
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/layout/logo"
import { SparklesText } from "@/components/ui/sparkles-text"
import { motion, AnimatePresence } from "framer-motion"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"
import { getOrder, updateOrder } from "@/lib/db/orders"
import { Suspense } from "react"

// All OxaPay supported cryptocurrencies (exact symbols from their API)
const paymentMethods = [
  { id: "balance", name: "Customer Balance", icon: Wallet2, description: "Click to authenticate", color: "#26BCC4" },
  { id: "bitcoin", name: "Bitcoin", icon: Bitcoin, description: "BTC", color: "#F7931A" },
  { id: "ethereum", name: "Ethereum", icon: Bitcoin, description: "ETH", color: "#627EEA" },
  { id: "litecoin", name: "Litecoin", icon: Bitcoin, description: "LTC", color: "#345D9D" },
  { id: "usdt-trc20", name: "USDT (TRC20)", icon: Bitcoin, description: "Tether on Tron", color: "#26A17B" },
  { id: "usdt-erc20", name: "USDT (ERC20)", icon: Bitcoin, description: "Tether on Ethereum", color: "#26A17B" },
  { id: "trx", name: "Tron", icon: Bitcoin, description: "TRX", color: "#FF0013" },
  { id: "dogecoin", name: "Dogecoin", icon: Bitcoin, description: "DOGE", color: "#C2A633" },
  { id: "bch", name: "Bitcoin Cash", icon: Bitcoin, description: "BCH", color: "#8DC351" },
  { id: "bnb", name: "BNB", icon: Bitcoin, description: "BSC", color: "#F3BA2F" },
  { id: "sol", name: "Solana", icon: Bitcoin, description: "SOL", color: "#9945FF" },
  { id: "usdc", name: "USDC", icon: Bitcoin, description: "USD Coin", color: "#2775CA" },
  { id: "ton", name: "TON", icon: Bitcoin, description: "Toncoin", color: "#0088CC" },
  { id: "pol", name: "Polygon", icon: Bitcoin, description: "POL", color: "#8247E5" },
  { id: "xmr", name: "Monero", icon: Bitcoin, description: "XMR", color: "#FF6600" },
  { id: "shib", name: "Shiba Inu", icon: Bitcoin, description: "SHIB", color: "#FFA409" },
  { id: "dai", name: "DAI", icon: Bitcoin, description: "Stablecoin", color: "#F5AC37" },
  { id: "paypal", name: "PayPal", icon: CreditCard, description: "Credit Card / PayPal", color: "#0070BA" },
]

function CheckoutMainContent() {
  const router = useRouter()
  const params = useParams()
  const urlOrderId = params.id as string

  const { cart, cartTotal, clearCart, isHydrated, addToCart, removeFromCart, setCart } = useCart()
  const { formatPrice } = useCurrency()
  const { settings } = useSiteSettingsWithDefaults()

  const [existingOrder, setExistingOrder] = React.useState<any>(null)
  const [isLoadingOrder, setIsLoadingOrder] = React.useState(false)

  // Load existing order if URL has id
  React.useEffect(() => {
    if (!urlOrderId || !isHydrated) return

    const loadExistingOrder = async () => {
      setIsLoadingOrder(true)
      try {
        const order = await getOrder(urlOrderId)
        if (order) {
          if (['paid', 'delivered', 'completed'].includes(order.status)) {
            router.push(`/invoice?id=${order.id}`)
            return
          }
          setExistingOrder(order)
          setEmail(order.email || "")

          // Sync cart if empty or different
          const orderItems = order.order_items.map((item: any) => ({
            id: item.product_id,
            variantId: item.variant_id,
            variantName: item.variant?.name,
            title: item.product?.name,
            price: item.price,
            quantity: item.quantity,
            image: item.product?.image_url
          }))
          setCart(orderItems)
        }
      } catch (error) {
        console.error("Failed to load order from URL:", error)
        toast.error("Invalid checkout link")
      } finally {
        setIsLoadingOrder(false)
      }
    }

    loadExistingOrder()
  }, [urlOrderId, isHydrated])

  const handleUpdateQuantity = (item: any, delta: number) => {
    const newQuantity = item.quantity + delta
    const minQty = item.min_quantity || 1
    const maxQty = item.max_quantity || 1000000

    if (delta > 0 && newQuantity > maxQty) {
      toast.error(`Maximum order quantity for this item is ${maxQty}`)
      return
    }

    if (delta < 0 && newQuantity < minQty && newQuantity > 0) {
      toast.error(`Minimum order quantity for this item is ${minQty}`)
      return
    }

    if (newQuantity >= 0) {
      addToCart({ ...item, quantity: delta })
    }
  }
  const [step, setStep] = React.useState(1)
  const [selectedMethod, setSelectedMethod] = React.useState("PayPal")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [agreeToTerms, setAgreeToTerms] = React.useState(false)
  const [agreeToPromo, setAgreeToPromo] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [orderId, setOrderId] = React.useState("")
  const [savedTotal, setSavedTotal] = React.useState(0) // Store total before clearing cart
  const [customFieldValues, setCustomFieldValues] = React.useState<Record<string, string>>({})

  // Promo Code State
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string
    type: 'percentage' | 'fixed'
    value: number
  } | null>(null)
  const [isCheckingCoupon, setIsCheckingCoupon] = React.useState(false)

  // Calculate totals
  const subtotal = savedTotal || cartTotal
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? subtotal * (appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0
  const finalTotal = Math.max(0, subtotal - discountAmount)


  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsCheckingCoupon(true)
    try {
      const { validateCoupon } = await import("@/lib/actions/coupons")
      const result = await validateCoupon(couponCode)

      if (result.valid && result.discount) {
        setAppliedCoupon(result.discount)
        toast.success(result.message)
      } else {
        setAppliedCoupon(null)
        toast.error(result.message || "Invalid coupon")
      }
    } catch (error) {
      toast.error("Failed to apply coupon")
    } finally {
      setIsCheckingCoupon(false)
    }
  }


  // Real payment details from OxaPay white-label API
  const [cryptoDetails, setCryptoDetails] = React.useState<{
    address: string
    amount: string
    invoiceId: string
    qrCodeUrl: string
    expiresAt: number
    payCurrency: string
    payLink: string
    exchangeRate?: number
  } | null>(null)

  // Countdown timer for payment expiration
  const [timeLeft, setTimeLeft] = React.useState<string>("--:--")

  React.useEffect(() => {
    if (!cryptoDetails?.expiresAt || step !== 2) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = cryptoDetails.expiresAt - now

      if (remaining <= 0) {
        setTimeLeft("EXPIRED")
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [cryptoDetails?.expiresAt, step])

  React.useEffect(() => {
    if (isHydrated && cart.length === 0 && step === 1 && !isProcessing && !urlOrderId) {
      router.push("/store")
    }
  }, [cart, router, step, isProcessing, isHydrated, urlOrderId])

  const handleProceedToPayment = async () => {
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms of Service to proceed.")
      return
    }

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }

    setIsProcessing(true)

    try {
      // Payment logic
      const isPayPal = selectedMethod === "PayPal"
      const isCrypto = !isPayPal && selectedMethod !== "Customer Balance"

      if (isCrypto || isPayPal) {
        const { createOrder } = await import("@/lib/db/orders")
        const { createPayment } = await import("@/lib/db/payments")

        // Map payment method to OxaPay currency codes (exact symbols from their API)
        const payCurrencyMap: Record<string, string> = {
          "Bitcoin": "BTC",
          "Ethereum": "ETH",
          "Litecoin": "LTC",
          "USDT (TRC20)": "USDT",
          "USDT (ERC20)": "USDT",
          "Tron": "TRX",
          "Dogecoin": "DOGE",
          "Bitcoin Cash": "BCH",
          "BNB": "BNB",
          "Solana": "SOL",
          "USDC": "USDC",
          "TON": "TON",
          "Polygon": "POL", // OxaPay uses POL, not MATIC
          "Monero": "XMR",
          "Shiba Inu": "SHIB",
          "DAI": "DAI",
          "NotCoin": "NOT",
          "Dogs": "DOGS",
        }

        // 1. Create or Update the Order in Supabase
        // Use finalTotal which includes discount
        const total = finalTotal
        const items = cart.filter(i => i.quantity > 0).map(item => ({
          product_id: item.id,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          price: item.price
        }))
        const customFields = customFieldValues

        // Handle $0.00 orders (100% discount)
        if (total === 0) {
          const { createOrder, updateOrder } = await import("@/lib/db/orders")
          const { completeFreeOrder } = await import("@/lib/actions/checkout")

          let order;
          if (existingOrder) {
            order = await updateOrder(existingOrder.id, {
              email,
              total,
              items,
              custom_fields: customFields
            })
          } else {
            order = await createOrder({
              email,
              total,
              items,
              custom_fields: customFields
            })
          }

          const result = await completeFreeOrder(order.id, appliedCoupon?.code)
          if (result.success) {
            clearCart()
            toast.success("Order completed! Your items are being delivered.")
            router.push(`/invoice?id=${order.id}`)
            return
          } else {
            throw new Error(result.error)
          }
        }

        // Pass total directly.
        let order;
        if (existingOrder) {
          order = await updateOrder(existingOrder.id, {
            email,
            total,
            items,
            custom_fields: customFields
          })
        } else {
          order = await createOrder({
            email,
            total,
            items,
            custom_fields: customFields
          })
        }

        setOrderId(order.id)

        // 2. Handle PayPal (Paylix) or Crypto (OxaPay)
        if (isPayPal) {
          const { createPaylixPayment } = await import("@/lib/payments/paylix")
          const response = await createPaylixPayment({
            title: `Order ${order.readable_id} from Rainyday`,
            value: total,
            currency: "USD",
            email: email,
            gateway: "PAYPAL",
            return_url: `${window.location.origin}/invoice?id=${order.id}`,
            webhook: `${window.location.origin}/api/webhooks/paylix`,
          })

          // 3. Create the Payment record
          await createPayment({
            order_id: order.id,
            provider: "PayPal",
            amount: total,
            currency: "USD",
            track_id: response.uniqid,
            pay_url: response.url
          })

          // 4. Redirect to Paylix
          clearCart()
          toast.success("Redirecting to PayPal...")
          window.location.href = response.url
          return
        }

        // 2b. Create the OxaPay Invoice (existing flow)
        const { createOxaPayWhiteLabelWithInquiry } = await import("@/lib/payments/oxapay")
        const response = await createOxaPayWhiteLabelWithInquiry({
          amount: total,
          currency: "USD",
          payCurrency: payCurrencyMap[selectedMethod] || "BTC",
          orderId: order.id,
          description: `Order ${order.readable_id} from Rainyday`,
          email: email,
          callbackUrl: `${window.location.origin}/api/webhooks/oxapay`,
          returnUrl: `${window.location.origin}/invoice?id=${order.id}`,
        })

        console.log("[Checkout] OxaPay Response:", response)

        // 3. Create the Payment record with OxaPay track ID and pay_url
        await createPayment({
          order_id: order.id,
          provider: payCurrencyMap[selectedMethod] || "Crypto",
          amount: total,
          currency: "USD",
          track_id: response.trackId,
          pay_url: response.payLink
        })

        // 4. Check if we need to redirect (white-label not available)
        if (response.isRedirect && response.payLink) {
          // Don't clear cart here - it will be cleared on payment-waiting page
          // Redirect to payment-waiting page which will handle OxaPay redirect and polling
          const paymentWaitingUrl = `/payment-waiting?orderId=${order.id}&payUrl=${encodeURIComponent(response.payLink)}`
          router.push(paymentWaitingUrl)
          return
        }

        // Calculate real crypto amount using live exchange rates
        let finalCryptoAmount = response.amount
        let exchangeRate = 0
        const selectedCrypto = payCurrencyMap[selectedMethod] || "BTC"

        // If OxaPay didn't return a proper crypto amount, OR if it just mirrored the USD amount, OR if we just want to be sure
        // Always try to calculate strict crypto amount to avoid "1 BTC" issues
        if (true) {
          const { convertUsdToCrypto } = await import("@/lib/payments/crypto-prices")
          const conversion = await convertUsdToCrypto(total, selectedCrypto)
          if (conversion) {
            // Only override if the API returned amount is suspicious (like equal to total USD or "1")
            // OR if we want to force our specific calculation
            // For now, let's trust our local calc if API returns same string as total (which means it didn't convert)
            if (!finalCryptoAmount || finalCryptoAmount === String(total) || finalCryptoAmount === "1" || finalCryptoAmount === "1.00") {
              finalCryptoAmount = conversion.cryptoAmount
            }
            exchangeRate = conversion.usdPrice
          }
        }


        // 5. Clear cart and redirect to invoice page for payment
        clearCart()
        toast.success("Order created! Redirecting to payment...")
        router.push(`/invoice?id=${order.id}`)
        return
      }

      // Normal flow for other methods if any
      clearCart()
      router.push(`/invoice?id=${orderId}`)
    } catch (error) {
      console.error("Payment Error:", error)
      toast.error("Failed to initialize payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Poll for payment status
  const [paymentStatus, setPaymentStatus] = React.useState<'pending' | 'processing' | 'completed' | 'expired'>('pending')

  // Effect to poll for payment status when on step 2
  React.useEffect(() => {
    if (step !== 2 || !orderId) return

    // Poll every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
        const info = await getOxaPayPaymentInfo(cryptoDetails?.invoiceId || '')
        if (info) {
          if (info.status === 'Paid' || info.status === 'Confirming') {
            setPaymentStatus('processing')
          }
          if (info.status === 'Paid' && info.txID) {
            setPaymentStatus('completed')
            toast.success("Payment Confirmed! Redirecting...")
            clearInterval(pollInterval)
            setTimeout(() => {
              router.push(`/invoice?id=${orderId}`)
            }, 2000)
          }
          if (info.status === 'Expired' || info.status === 'Failed') {
            setPaymentStatus('expired')
            toast.error("Payment expired. Please try again.")
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error("Error polling payment status:", error)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [step, orderId, cryptoDetails?.invoiceId, router])

  const handleCheckPaymentStatus = async () => {
    setIsProcessing(true)
    try {
      const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
      const info = await getOxaPayPaymentInfo(cryptoDetails?.invoiceId || '')
      if (info) {
        if (info.status === 'Paid' || info.status === 'Confirming') {
          setPaymentStatus('processing')
          toast.success("Payment detected! Confirming on blockchain...")
        }
        if (info.status === 'Paid' && info.txID) {
          setPaymentStatus('completed')
          toast.success("Payment Confirmed! Redirecting...")
          setTimeout(() => {
            router.push(`/invoice?id=${orderId}`)
          }, 2000)
        } else if (info.status === 'Expired') {
          setPaymentStatus('expired')
          toast.error("Payment expired. Please try again.")
        } else {
          toast.info("Waiting for payment...")
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
      toast.error("Unable to check payment status")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020406]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-black uppercase tracking-widest">Loading checkout module...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0 && step === 1 && !urlOrderId) return null

  return (
    <div className="min-h-screen bg-[#020406] text-white selection:bg-brand-primary/30 antialiased overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Order Summary */}
        <div className="w-full lg:w-[35%] p-6 md:p-8 lg:p-12 space-y-8 md:space-y-12 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 bg-background/20 backdrop-blur-3xl">
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Logo />
              </motion.div>
            </div>

            <div className="space-y-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] translate-x-1">Pay Rainyday</p>
                <div className="flex items-baseline gap-2">
                  <SparklesText
                    text={formatPrice(finalTotal)}
                    className="text-4xl font-black tracking-tighter"
                    colors={{ first: "#a4f8ff", second: "#ffffff" }}
                  />
                  {savedTotal > 0 && appliedCoupon && (
                    <span className="text-lg font-bold text-white/40 line-through decoration-white/20 decoration-2">
                      {formatPrice(savedTotal)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-[30vh] lg:max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {cart.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all hover:border-white/10"
                    >
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
                        <Image src={item.image || "/logo.png"} alt={item.title || "Product"} fill sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">{item.title}</h3>
                        {item.variantName && (
                          <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-0.5">{item.variantName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
                            <button
                              disabled={item.quantity <= 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQuantity(item, -1);
                              }}
                              className="p-1 hover:bg-white/20 rounded-md transition-colors text-white hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-black w-5 text-center text-white">{item.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQuantity(item, 1);
                              }}
                              className="p-1 hover:bg-white/20 rounded-md transition-colors text-white hover:text-brand-primary"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQuantity(item, -item.quantity);
                              toast.info(`Set ${item.title}${item.variantName ? ` (${item.variantName})` : ''} to 0`);
                            }}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white group-hover:text-brand-primary transition-colors">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4 bg-gradient-to-t from-black/20 to-transparent">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                <span className="flex items-center gap-2 ">Subtotal</span>
                <span className="text-white/60 tracking-normal">{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-primary">
                  <span className="flex items-center gap-2 ">Discount <span className="text-white/40">({appliedCoupon.code})</span></span>
                  <span className="tracking-normal">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                <span className="flex items-center gap-2 ">Processing Fee</span>
                <span className="tracking-normal">$0.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-white uppercase opacity-40">Total Amount</span>
                <div className="text-right">
                  <SparklesText
                    text={formatPrice(finalTotal)}
                    className="block text-xl sm:text-2xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_15px_rgba(164,248,255,0.2)]"
                    sparklesCount={8}
                  />
                  <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Steps & Payment */}
        <div className="flex-1 p-8 lg:p-12 lg:px-20 bg-[#030607]/40 backdrop-blur-md relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(38,188,196,0.05),transparent_60%)] pointer-events-none" />

          {/* Steps Navigation */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 relative z-10 mb-8 md:mb-12">
            {[
              { s: 1, label: "Order Info", icon: User },
              { s: 2, label: "Confirm & Pay", icon: CreditCard },
              { s: 3, label: "Receive Goods", icon: Search }
            ].map((item) => {
              const Icon = item.icon
              const isCompleted = step > item.s
              const isActive = step === item.s
              return (
                <div key={item.s} className="space-y-3 group cursor-pointer" onClick={() => step > item.s && setStep(item.s)}>
                  <div className="relative">
                    <div className={cn(
                      "h-1 rounded-full transition-all duration-700 relative z-10",
                      isActive || isCompleted ? "bg-brand-primary shadow-[0_0_20px_rgba(38,188,196,0.4)]" : "bg-white/10"
                    )} />
                    {isActive && (
                      <motion.div
                        layoutId="step-glow"
                        className="absolute -inset-1 bg-brand-primary/20 blur-lg rounded-full"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500",
                      isActive || isCompleted ? "bg-brand-primary/10 text-brand-primary" : "text-white/10"
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <p className={cn(
                        "text-[8px] font-black uppercase tracking-[0.2em] transition-colors",
                        isActive || isCompleted ? "text-brand-primary" : "text-white/20"
                      )}>Step 0{item.s}</p>
                      <p className={cn(
                        "text-[9px] md:text-[10px] font-bold tracking-tight transition-colors truncate",
                        isActive || isCompleted ? "text-white" : "text-white/20"
                      )}>{item.label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex-1 max-w-xl w-full mx-auto flex flex-col relative z-10">
            <AnimatePresence mode="wait">
              {/* Step 1 Content: Order Details */}
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 pb-12"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-2.5 h-2.5 text-brand-primary" />
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Customer E-mail</label>
                      </div>
                      <div className="relative group">
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="The order confirmation will be sent here."
                          className="h-14 px-6 bg-white/[0.03] border-white/5 rounded-2xl focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-base"
                        />
                        <div className="absolute inset-0 rounded-2xl border border-white/0 group-focus-within:border-brand-primary/20 pointer-events-none transition-all" />
                      </div>
                    </div>

                    {settings.checkout.show_coupon && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CircleSlash className="w-2.5 h-2.5 text-brand-primary" />
                          <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Promo Code</label>
                        </div>
                        <div className="relative group">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Enter coupon code..."
                            disabled={!!appliedCoupon || isCheckingCoupon}
                            className={cn(
                              "h-14 px-6 pr-28 bg-white/[0.03] border-white/5 rounded-2xl focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-sm",
                              appliedCoupon && "border-brand-primary/40 text-brand-primary"
                            )}
                          />
                          {appliedCoupon ? (
                            <button
                              onClick={() => {
                                setAppliedCoupon(null)
                                setCouponCode("")
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 px-5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest"
                            >
                              Remove
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={handleApplyCoupon}
                              disabled={isCheckingCoupon || !couponCode}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 px-5 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[9px] font-black text-brand-primary hover:bg-brand-primary hover:text-black transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                            >
                              {isCheckingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <>
                                Apply
                                <ArrowRight className="w-3 h-3" />
                              </>}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Custom Fields */}
                    {cart.some(item => item.custom_fields && item.custom_fields.length > 0) && (
                      <div className="space-y-6">
                        {cart.filter(item => item.custom_fields && item.custom_fields.length > 0).map((item) => (
                          <div key={item.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-2.5 h-2.5 text-brand-primary" />
                              <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                {item.title} - Extra Info
                              </label>
                            </div>
                            <div className="space-y-4">
                              {item.custom_fields?.map((field: any) => (
                                <div key={field.name} className="space-y-2">
                                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">
                                    {field.name} {field.required && <span className="text-red-500">*</span>}
                                  </label>
                                  <div className="relative group">
                                    <Input
                                      value={customFieldValues[`${item.id}_${field.name}`] || field.default_value || ""}
                                      onChange={(e) => setCustomFieldValues({
                                        ...customFieldValues,
                                        [`${item.id}_${field.name}`]: e.target.value
                                      })}
                                      placeholder={field.hint || `Enter ${field.name}...`}
                                      className="h-14 px-6 bg-white/[0.03] border-white/5 rounded-2xl focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-sm"
                                    />
                                    <div className="absolute inset-0 rounded-2xl border border-white/0 group-focus-within:border-brand-primary/20 pointer-events-none transition-all" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-8 pl-1">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-sm font-bold text-white tracking-tight">Payment Methods</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                          <LockKeyhole className="w-3 h-3 text-brand-primary" />
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Secure • Instant</span>
                        </div>
                      </div>

                      <div className="space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">

                        {/* Primary Method */}
                        <div
                          onClick={() => setSelectedMethod("PayPal")}
                          className={cn(
                            "relative flex items-center gap-6 py-5 px-4 rounded-xl cursor-pointer group transition-all duration-300 overflow-hidden",
                            selectedMethod === "PayPal"
                              ? "bg-blue-500/[0.15] border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.3)]"
                              : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                          )}
                        >
                          <div className="relative z-10 w-12 h-12 flex items-center justify-center flex-shrink-0">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg" alt="PayPal" className="w-10 h-auto object-contain" />
                          </div>
                          <div className="relative z-10 flex flex-col">
                            <span className="text-xl font-bold text-white tracking-tight">PayPal</span>
                          </div>
                          {selectedMethod === "PayPal" && (
                            <div className="absolute right-4 text-brand-primary animate-in zoom-in duration-300">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Grouped Crypto Sections */}
                        {[
                          {
                            label: "Major Currencies",
                            items: [
                              { id: "btc", name: "Bitcoin", icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035", network: "BTC", color: "#F7931A" },
                              { id: "eth", name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", network: "ERC20", color: "#627EEA" },
                              { id: "ltc", name: "Litecoin", icon: "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035", network: "LTC", color: "#345D9D" },
                            ]
                          },
                          {
                            label: "Stablecoins",
                            items: [
                              { id: "usdt-trc20", name: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035", network: "TRC20", color: "#26A17B" },
                              { id: "usdt-erc20", name: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035", network: "ERC20", color: "#26A17B" },
                              { id: "usdc", name: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035", network: "ERC20", color: "#2775CA" },
                              { id: "dai", name: "DAI", icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=035", network: "ERC20", color: "#F5AC37" },
                            ]
                          },
                          {
                            label: "Alt Networks",
                            items: [
                              { id: "sol", name: "Solana", icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035", network: "SOL", color: "#9945FF" },
                              { id: "trx", name: "Tron", icon: "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035", network: "TRX", color: "#FF0013" },
                              { id: "doge", name: "Dogecoin", icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035", network: "DOGE", color: "#C2A633" },
                              { id: "bnb", name: "BNB", icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035", network: "BSC", color: "#F3BA2F" },
                              { id: "ton", name: "TON", icon: "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035", network: "TON", color: "#0088CC" },
                              { id: "pol", name: "Polygon", icon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=035", network: "POL", color: "#8247E5" },
                              { id: "xmr", name: "Monero", icon: "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035", network: "XMR", color: "#FF6600" },
                              { id: "bch", name: "Bitcoin Cash", icon: "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg?v=035", network: "BCH", color: "#8DC351" },
                            ]
                          }
                        ].map((group) => (
                          <div key={group.label} className="space-y-4">
                            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest pl-1">{group.label}</h4>
                            <div className="flex flex-wrap gap-x-6 gap-y-4">
                              {group.items.map((method) => {
                                const methodName = method.name === "USDT" ? `${method.name} (${method.network})` : method.name
                                const isSelected = selectedMethod === methodName

                                return (
                                  <div
                                    key={method.id + method.network}
                                    onClick={() => setSelectedMethod(methodName)}
                                    style={{ "--item-color": method.color } as React.CSSProperties}
                                    className={cn(
                                      "relative flex items-center gap-3 cursor-pointer group transition-all duration-200 pr-4 py-2 rounded-lg",
                                      isSelected ? "bg-[var(--item-color)]/10 ring-1 ring-[var(--item-color)]/50" : "hover:bg-white/[0.04]"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-9 h-9 rounded-full flex items-center justify-center p-1.5 transition-all duration-300",
                                      isSelected ? "bg-[var(--item-color)]/20 scale-110" : "bg-white/5 group-hover:bg-white/10 group-hover:scale-105"
                                    )}>
                                      <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                                    </div>

                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "text-sm font-bold tracking-tight transition-colors",
                                          isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                                        )}>{method.name}</span>
                                        {method.id === "ltc" && (
                                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                            <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">Popular</span>
                                          </div>
                                        )}
                                      </div>
                                      <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-wide transition-colors",
                                        isSelected ? "text-[var(--item-color)]" : "text-white/30"
                                      )}>{method.network}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                      {[
                        { label: "Terms of Service", state: agreeToTerms, setter: setAgreeToTerms, show: settings.checkout.show_terms },
                        { label: "Promotional Updates", state: agreeToPromo, setter: setAgreeToPromo, show: settings.checkout.show_newsletter }
                      ].filter(c => c.show).map((check, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group select-none">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={check.state}
                              onChange={(e) => check.setter(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={cn(
                              "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center relative z-10",
                              check.state ? "bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(38,188,196,0.3)]" : "border-white/10 group-hover:border-white/20"
                            )}>
                              {check.state && <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={4} />}
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            check.state ? "text-white" : "text-white/20 group-hover:text-white/40"
                          )}>I agree to {check.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isProcessing}
                    className="w-full h-16 bg-brand-primary text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_-10px_rgba(38,188,196,0.3)] flex items-center justify-center gap-4 group relative overflow-hidden disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                        <span className="text-xl relative z-10 flex items-center gap-3">
                          Proceed to Payment
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/20 transition-colors duration-1000" />

                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Payment Method</p>
                          <h3 className="text-2xl font-black">{selectedMethod}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                          <Bitcoin className="w-8 h-8 text-brand-primary" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-[32px] border border-white/5 relative group/qr">
                        <div className="absolute inset-0 bg-brand-primary/5 blur-3xl opacity-0 group-hover/qr:opacity-100 transition-opacity duration-1000" />
                        <QrCode className="w-48 h-48 text-white opacity-20 absolute" />
                        <div className="relative w-44 h-44 bg-white rounded-2xl p-3 shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover/qr:scale-105 transition-transform duration-500">
                          <Image
                            src={cryptoDetails?.qrCodeUrl || "/logo.png"}
                            alt="QR Code"
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 group-hover/qr:text-brand-primary transition-colors">Scan to pay securely</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                            <span>Amount to send</span>
                            <span className="text-brand-primary">Live Rate</span>
                          </div>
                          <div
                            onClick={() => copyToClipboard(cryptoDetails?.amount || '')}
                            className="h-16 px-6 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group/copy cursor-pointer hover:bg-white/[0.06] hover:border-brand-primary/30 transition-all"
                          >
                            <span className="text-lg font-black tracking-tight">{cryptoDetails?.amount} {cryptoDetails?.payCurrency}</span>
                            <Copy className="w-5 h-5 text-white/10 group-hover/copy:text-brand-primary transition-colors" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                            <span>Destination Address</span>
                          </div>
                          <div
                            onClick={() => copyToClipboard(cryptoDetails?.address || '')}
                            className="h-16 px-6 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group/copy cursor-pointer hover:bg-white/[0.06] hover:border-brand-primary/30 transition-all"
                          >
                            <span className="text-sm font-bold text-white/60 truncate mr-4">{cryptoDetails?.address}</span>
                            <Copy className="w-5 h-5 text-white/10 group-hover/copy:text-brand-primary transition-colors shrink-0" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Time Remaining</p>
                            <p className="text-sm font-black text-orange-400">{timeLeft}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Network</p>
                          <p className="text-sm font-black text-brand-primary">{cryptoDetails?.payCurrency} Native</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckPaymentStatus}
                    disabled={isProcessing}
                    className="w-full h-20 bg-brand-primary text-black font-black uppercase tracking-[0.4em] rounded-[32px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-15px_rgba(38,188,196,0.4)] flex flex-col items-center justify-center group relative overflow-hidden"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : paymentStatus === 'processing' ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="text-[8px] tracking-[0.5em]">Confirming on Blockchain...</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                        <span className="text-xl relative z-10 flex items-center gap-3">
                          Check Payment Status
                          <ShieldCheck className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        </span>
                        <span className="text-[8px] font-black opacity-40 group-hover:opacity-100 transition-opacity">Auto-checking every 5 seconds</span>
                      </>
                    )}
                  </Button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full h-10 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-brand-primary transition-all flex items-center justify-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Return to order information
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Footer Link */}
            <div className="mt-auto py-10 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-[#030607] to-transparent">
              <Link href="/store" className="flex items-center gap-3 text-[10px] font-black text-white/20 hover:text-brand-primary uppercase tracking-[0.3em] transition-all group">
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Keep Shopping
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-widest ">
                <span>Secured by Hansa Sentinel</span>
                <Lock className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(38, 188, 196, 0.2);
        }
      `}</style>
    </div >
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#020406]">
        <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutMainContent />
    </Suspense>
  )
}
