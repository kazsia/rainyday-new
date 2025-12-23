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
    Globe2,
    ChevronDown,
    Copy,
    QrCode,
    CheckCircle2,
    Wallet2,
    Lock,
    Clock,
    Search,
    ChevronRight,
    CircleSlash,
    LockKeyhole,
    User,
    Mail,
    AlertCircle,
    Minus,
    Plus,
    Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
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
]

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, cartTotal, clearCart, isHydrated, addToCart, removeFromCart } = useCart()
    const { formatPrice } = useCurrency()
    const { settings } = useSiteSettingsWithDefaults()

    const handleUpdateQuantity = (item: any, delta: number) => {
        if (item.quantity + delta > 0) {
            addToCart({ ...item, quantity: delta })
        } else {
            removeFromCart(item.id, item.variantId)
            toast.info(`Removed ${item.title}${item.variantName ? ` (${item.variantName})` : ''} from cart`)
        }
    }
    const [step, setStep] = React.useState(1)
    const [selectedMethod, setSelectedMethod] = React.useState("Bitcoin")
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [agreeToTerms, setAgreeToTerms] = React.useState(false)
    const [agreeToPromo, setAgreeToPromo] = React.useState(false)
    const [email, setEmail] = React.useState("")
    const [orderId, setOrderId] = React.useState("")
    const [savedTotal, setSavedTotal] = React.useState(0) // Store total before clearing cart

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
        if (isHydrated && cart.length === 0 && step === 1 && !isProcessing) {
            router.push("/store")
        }
    }, [cart, router, step, isProcessing, isHydrated])

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
            // All crypto payment methods (everything except Customer Balance)
            const isCrypto = selectedMethod !== "Customer Balance"

            if (isCrypto) {
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
                    "Polygon": "POL",  // OxaPay uses POL, not MATIC
                    "Monero": "XMR",
                    "Shiba Inu": "SHIB",
                    "DAI": "DAI",
                    "NotCoin": "NOT",
                    "Dogs": "DOGS",
                }

                // 1. Create the Order in Supabase
                // Use finalTotal which includes discount
                const total = finalTotal
                const items = cart.map(item => ({
                    product_id: item.id,
                    variant_id: item.variantId || null,
                    quantity: item.quantity || 1,
                    price: item.price
                }))

                // Pass total directly.
                // Note: If createOrder doesn't support discount meta yet, we just pass the discounted total.
                // Ideally we should add discount info to the order, but for now getting the correct price is P0.
                const order = await createOrder({
                    email,
                    total,
                    items
                })

                setOrderId(order.id)

                // 2. Create the OxaPay Invoice and fetch payment details for embedded display
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

                // 3. Create the Payment record with OxaPay track ID
                await createPayment({
                    order_id: order.id,
                    provider: payCurrencyMap[selectedMethod] || "Crypto",
                    amount: total,
                    currency: "USD",
                    track_id: response.trackId
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

                // If OxaPay didn't return a proper crypto amount, calculate it ourselves
                if (!finalCryptoAmount || finalCryptoAmount === String(total)) {
                    const { convertUsdToCrypto } = await import("@/lib/payments/crypto-prices")
                    const conversion = await convertUsdToCrypto(total, selectedCrypto)
                    if (conversion) {
                        finalCryptoAmount = conversion.cryptoAmount
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

    if (cart.length === 0 && step === 1) return null

    return (
        <div className="min-h-screen bg-[#020406] text-white selection:bg-brand-primary/30 antialiased overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative flex flex-col lg:flex-row min-h-screen">
                {/* Left Panel - Order Summary */}
                <div className="w-full lg:w-[35%] p-8 lg:p-12 space-y-12 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col justify-between border-r border-white/5 bg-[#0a1628]/20 backdrop-blur-3xl">
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <Logo />
                            </motion.div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-all group">
                                <Globe2 className="w-3.5 h-3.5 text-white/40 group-hover:text-brand-primary transition-colors" />
                                <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">English</span>
                                <ChevronDown className="w-3.5 h-3.5 text-white/20" />
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] translate-x-1">Pay Rainyday</p>
                                <div className="flex items-baseline gap-2">
                                    <SparklesText
                                        text={formatPrice(finalTotal)}
                                        className="text-4xl font-black italic tracking-tighter"
                                        colors={{ first: "#a4f8ff", second: "#ffffff" }}
                                    />
                                    {savedTotal > 0 && appliedCoupon && (
                                        <span className="text-lg font-bold text-white/40 line-through decoration-white/20 decoration-2">
                                            {formatPrice(savedTotal)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-4 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {cart.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all hover:border-white/10"
                                        >
                                            <Image src={item.image || "/logo.png"} alt={item.title || "Product"} fill sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">{item.title}</h3>
                                                {item.variantName && (
                                                    <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-0.5">{item.variantName}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateQuantity(item, -1);
                                                            }}
                                                            className="p-1 hover:bg-white/20 rounded-md transition-colors text-white hover:text-brand-primary"
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
                                                            removeFromCart(item.id, item.variantId);
                                                            toast.info(`Removed ${item.title}${item.variantName ? ` (${item.variantName})` : ''} from cart`);
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
                                <span className="flex items-center gap-2 italic">Subtotal</span>
                                <span className="text-white/60 tracking-normal">{formatPrice(subtotal)}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-primary">
                                    <span className="flex items-center gap-2 italic">Discount <span className="text-white/40">({appliedCoupon.code})</span></span>
                                    <span className="tracking-normal">-{formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                                <span className="flex items-center gap-2 italic">Processing Fee</span>
                                <span className="tracking-normal">$0.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-black italic tracking-widest text-white uppercase opacity-40">Total Amount</span>
                                <div className="text-right">
                                    <SparklesText
                                        text={formatPrice(finalTotal)}
                                        className="block text-2xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_15px_rgba(164,248,255,0.2)]"
                                        sparklesCount={8}
                                    />
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">Secure Transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Steps & Payment */}
                <div className="flex-1 p-8 lg:p-12 lg:px-20 bg-[#030607]/40 backdrop-blur-md relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(38,188,196,0.05),transparent_60%)] pointer-events-none" />

                    {/* Steps Navigation */}
                    <div className="grid grid-cols-3 gap-6 relative z-10 mb-12">
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
                                                "text-[10px] font-bold tracking-tight transition-colors truncate",
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
                                                    className="h-14 px-6 bg-white/[0.03] border-white/5 rounded-2xl focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold italic text-base"
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
                                                            "h-14 px-6 pr-28 bg-white/[0.03] border-white/5 rounded-2xl focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold italic text-sm",
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

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-2.5 h-2.5 text-brand-primary" />
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Payment System</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {[
                                                    { id: "btc", name: "Bitcoin", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg" },
                                                    { id: "eth", name: "Ethereum", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/eth.svg" },
                                                    { id: "ltc", name: "Litecoin", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/ltc.svg" },
                                                    { id: "usdt-trc20", name: "USDT (TRC20)", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/usdt.svg" },
                                                    { id: "usdt-erc20", name: "USDT (ERC20)", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/usdt.svg" },
                                                    { id: "trx", name: "Tron", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/trx.svg" },
                                                    { id: "doge", name: "Dogecoin", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/doge.svg" },
                                                    { id: "bch", name: "Bitcoin Cash", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/bch.svg" },
                                                    { id: "bnb", name: "BNB", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/bnb.svg" },
                                                    { id: "sol", name: "Solana", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/sol.svg" },
                                                    { id: "usdc", name: "USDC", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/usdc.svg" },
                                                    { id: "ton", name: "TON", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png" },
                                                    { id: "pol", name: "Polygon", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/matic.svg" },
                                                    { id: "xmr", name: "Monero", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/xmr.svg" },
                                                    { id: "shib", name: "Shiba Inu", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png" },
                                                    { id: "dai", name: "DAI", icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/dai.svg" },
                                                ].map((method) => (
                                                    <div
                                                        key={method.id}
                                                        onClick={() => setSelectedMethod(method.name)}
                                                        className={cn(
                                                            "relative p-4 rounded-2xl border transition-all cursor-pointer group overflow-hidden",
                                                            selectedMethod === method.name
                                                                ? "bg-brand-primary/5 border-brand-primary shadow-[0_0_30px_rgba(38,188,196,0.1)]"
                                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                                                selectedMethod === method.name ? "bg-brand-primary/20" : "bg-[#0a1628]/40 border border-white/5"
                                                            )}>
                                                                <img src={method.icon} alt={method.name} className="w-6 h-6" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest",
                                                                    selectedMethod === method.name ? "text-brand-primary" : "text-white/40"
                                                                )}>{method.name}</p>
                                                                <p className="text-[8px] text-white/20 font-bold">Fast Confirmation</p>
                                                            </div>
                                                        </div>
                                                        {selectedMethod === method.name && (
                                                            <motion.div
                                                                layoutId="active-indicator"
                                                                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(38,188,196,0.8)]"
                                                            />
                                                        )}
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
                                        className="w-full h-16 bg-brand-primary text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_-10px_rgba(38,188,196,0.3)] flex items-center justify-center gap-4 group relative overflow-hidden italic disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                                        <span className="text-base relative z-10">{isProcessing ? "Processing..." : "Proceed to Payment"}</span>
                                        {!isProcessing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />}
                                    </Button>
                                </motion.div>
                            ) : (
                                /* Step 2 Content: Payment Confirmation */
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8 pb-12"
                                >
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-14 h-14 rounded-xl bg-[#0a1628] border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                                                <img
                                                    src={
                                                        selectedMethod.toLowerCase() === 'bitcoin' ? "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg" :
                                                            selectedMethod.toLowerCase() === 'ethereum' ? "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/eth.svg" :
                                                                selectedMethod.toLowerCase() === 'litecoin' ? "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/ltc.svg" :
                                                                    "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/xmr.svg"
                                                    }
                                                    alt={selectedMethod}
                                                    className="w-8 h-8"
                                                />
                                            </div>
                                            <div className="relative z-10 space-y-0.5">
                                                <h2 className="text-xl font-black text-white italic capitalize tracking-tight">{selectedMethod} Payment</h2>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-brand-primary/60 tracking-[0.2em] uppercase">
                                                    <LockKeyhole className="w-2.5 h-2.5" />
                                                    Invoice ID: {cryptoDetails?.invoiceId || 'Loading...'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-1.5 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                                            {[
                                                { label: "Order ID", value: cryptoDetails?.invoiceId || '', copy: true },
                                                { label: "Verified Email", value: email || 'Not provided' },
                                                { label: "Gateway Status", value: paymentStatus === 'completed' ? 'Paid' : paymentStatus === 'processing' ? 'Confirming' : 'Awaiting Payment', highlight: true },
                                                { label: "Amount Due", value: cryptoDetails ? `${cryptoDetails.amount} ${cryptoDetails.payCurrency}` : 'Loading...' },
                                                { label: "Exchange Rate", value: cryptoDetails?.exchangeRate ? `1 ${cryptoDetails.payCurrency} = $${cryptoDetails.exchangeRate.toLocaleString()}` : 'Live rate' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors group/item">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">{item.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "text-[10px] font-black tracking-tight",
                                                            item.highlight ? "text-brand-primary" : "text-white/60"
                                                        )}>{item.value}</span>
                                                        {item.copy && (
                                                            <button onClick={() => copyToClipboard(item.value)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-brand-primary/20 hover:text-brand-primary transition-all opacity-0 group-hover/item:opacity-100">
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center gap-3 relative overflow-hidden group">
                                            <motion.div
                                                animate={{ x: [-20, 20, -20] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 bg-brand-primary/5 pointer-events-none"
                                            />
                                            <Clock className="w-4 h-4 text-brand-primary animate-pulse relative z-10" />
                                            <p className={cn(
                                                "text-[9px] font-black italic tracking-widest relative z-10 uppercase transition-all group-hover:tracking-[0.2em]",
                                                timeLeft === "EXPIRED" ? "text-red-500" : "text-brand-primary"
                                            )}>Expires in {timeLeft}</p>
                                        </div>

                                        <div className="space-y-10 py-4">
                                            <div className="flex gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-brand-primary text-black flex items-center justify-center text-sm font-black italic shrink-0 shadow-[0_0_20px_rgba(38,188,196,0.3)]">01</div>
                                                <div className="space-y-6 flex-1">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Send to Address</h3>
                                                        <p className="text-[10px] text-white/30 font-medium">Scan QR or manually copy the destination.</p>
                                                    </div>

                                                    <motion.div
                                                        whileHover={{ scale: 1.02 }}
                                                        className="w-40 h-40 bg-white p-4 rounded-[2rem] shrink-0 shadow-[0_0_50px_rgba(255,255,255,0.05)] mx-auto lg:mx-0 group cursor-pointer relative"
                                                    >
                                                        <div className="absolute inset-0 border-[2px] border-brand-primary/30 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                                                        <div className="w-full h-full relative">
                                                            {cryptoDetails?.qrCodeUrl ? (
                                                                <img src={cryptoDetails.qrCodeUrl} alt="Payment QR Code" className="w-full h-full rounded-xl" />
                                                            ) : (
                                                                <QrCode className="w-full h-full text-black" strokeWidth={1.5} />
                                                            )}
                                                        </div>
                                                    </motion.div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                                                                {cryptoDetails?.address ? "Payment Wallet" : "Scan QR to Pay"}
                                                            </label>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            {cryptoDetails?.address ? (
                                                                <div
                                                                    onClick={() => cryptoDetails?.address && copyToClipboard(cryptoDetails.address)}
                                                                    className="flex-1 h-14 px-5 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center justify-between group/addr cursor-pointer hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                                                                >
                                                                    <code className="text-xs font-mono text-brand-primary font-bold truncate max-w-[150px]">{cryptoDetails.address}</code>
                                                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/addr:bg-brand-primary group-hover/addr:text-black transition-all">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1 h-14 px-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                                                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                                    <span className="text-xs text-yellow-500/80">Scan QR code to open payment page</span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => cryptoDetails?.payLink && window.open(cryptoDetails.payLink, '_blank')}
                                                                className="h-14 px-6 bg-white/[0.03] border border-white/10 rounded-2xl text-[8px] font-black text-white/40 hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-all uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-1 group"
                                                            >
                                                                <Wallet className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                                Open
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-brand-primary text-black flex items-center justify-center text-sm font-black italic shrink-0 shadow-[0_0_20px_rgba(38,188,196,0.3)]">02</div>
                                                <div className="space-y-4 flex-1">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Exact Amount</h3>
                                                        <p className="text-[10px] text-white/30 font-medium">Send exactly this amount to the address above.</p>
                                                    </div>
                                                    <div
                                                        onClick={() => cryptoDetails?.amount && copyToClipboard(cryptoDetails.amount)}
                                                        className="inline-flex h-14 px-8 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl items-center gap-4 group/amt cursor-pointer hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                                                    >
                                                        <SparklesText
                                                            text={`${cryptoDetails?.amount || 'Loading...'} ${cryptoDetails?.payCurrency || 'BTC'}`}
                                                            className="text-xl font-black text-brand-primary tracking-tighter italic"
                                                            sparklesCount={10}
                                                        />
                                                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/amt:bg-brand-primary group-hover/amt:text-black transition-all">
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleCheckPaymentStatus}
                                            disabled={isProcessing || paymentStatus === 'completed'}
                                            className={cn(
                                                "w-full h-20 font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden italic",
                                                paymentStatus === 'completed'
                                                    ? "bg-green-500 text-black shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)]"
                                                    : paymentStatus === 'processing'
                                                        ? "bg-yellow-500 text-black shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)]"
                                                        : "bg-brand-primary text-black shadow-[0_20px_40px_-10px_rgba(38,188,196,0.4)]"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Loader2 className="w-7 h-7 animate-spin" />
                                                    <span className="text-[8px] tracking-[0.5em] animate-pulse">Checking Status...</span>
                                                </div>
                                            ) : paymentStatus === 'completed' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <CheckCircle2 className="w-7 h-7" />
                                                    <span className="text-[8px] tracking-[0.5em]">Payment Confirmed!</span>
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
                                            className="w-full h-10 text-[9px] font-black italic uppercase tracking-[0.3em] text-white/20 hover:text-brand-primary transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                            Return to order information
                                        </button>
                                    </div>
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
                            <div className="flex items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-widest italic">
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
