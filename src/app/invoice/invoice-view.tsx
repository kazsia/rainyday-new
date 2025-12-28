/**
 * Invoice Page - Real-time Blockchain Tracking
 * [Cache Break: v1.0.2 - HMR Factory Fix]
 */
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { Star, MessageSquareQuote, CheckCircle2, Copy, Download, ChevronDown, ExternalLink, Clock, User, Mail, CreditCard, Search, ShieldCheck, ArrowRight, Lock, QrCode, Wallet, Loader2, LockKeyhole, Ban } from "lucide-react"
import { getOrder } from "@/lib/db/orders"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/layout/logo"
import { cn } from "@/lib/utils"
import { SparklesText } from "@/components/ui/sparkles-text"
import { trackAddressStatus, TransactionStatus } from "@/lib/payments/blockchain-tracking"
import { FeedbackForm } from "@/components/feedback/feedback-form"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

const getPaymentIcon = (provider: string) => {
  const p = provider.toLowerCase()
  if (p.includes('btc') || p.includes('bitcoin')) return "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035"
  if (p.includes('eth') || p.includes('ethereum')) return "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035"
  if (p.includes('ltc') || p.includes('litecoin')) return "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035"
  if (p.includes('usdt') || p.includes('tether')) return "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035"
  if (p.includes('usdc')) return "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035"
  if (p.includes('sol') || p.includes('solana')) return "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035"
  if (p.includes('trx') || p.includes('tron')) return "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035"
  if (p.includes('bnb')) return "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035"
  if (p.includes('doge')) return "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035"
  if (p.includes('shib')) return "https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=035"
  if (p.includes('ton')) return "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035"
  if (p.includes('paypal') || p === 'pp') return "https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg"
  return null
}

const getExplorerUrl = (txId: string, provider: string) => {
  if (!txId) return "#"
  const p = provider.toLowerCase()
  if (p.includes('btc') || p.includes('bitcoin')) return `https://mempool.space/tx/${txId}`
  if (p.includes('eth') || p.includes('ethereum')) return `https://etherscan.io/tx/${txId}`
  if (p.includes('ltc') || p.includes('litecoin')) return `https://live.blockcypher.com/ltc/tx/${txId}`
  if (p.includes('doge')) return `https://live.blockcypher.com/doge/tx/${txId}`
  if (p.includes('trx') || p.includes('trc20')) return `https://tronscan.org/#/transaction/${txId}`
  if (p.includes('bnb') || p.includes('bep20')) return `https://bscscan.com/tx/${txId}`
  if (p.includes('sol')) return `https://solscan.io/tx/${txId}`
  return "#"
}

function InvoiceContent() {
  const { settings } = useSiteSettingsWithDefaults()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeliveredItemsOpen, setIsDeliveredItemsOpen] = useState(true)

  // Payment details state
  const [paymentDetails, setPaymentDetails] = useState<{
    address: string
    amount: string
    qrCodeUrl: string
    expiresAt: number
    payCurrency: string
    payLink: string
    trackId: string
  } | null>(null)
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'expired'>('pending')
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<TransactionStatus | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("--:--")

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false)
      return
    }

    loadOrder()
  }, [orderId])

  useEffect(() => {
    if (!order?.id) return

    // Realtime subscription using the actual UUID
    const supabase = createClient()
    const channel = supabase
      .channel(`order_${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        () => {
          loadOrder(false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: `order_id=eq.${order.id}` },
        () => {
          loadOrder(false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries', filter: `order_id=eq.${order.id}` },
        () => {
          loadOrder(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order?.id])

  async function loadOrder(showLoader = true) {
    if (showLoader) setIsLoading(true)
    try {
      const data = await getOrder(orderId!)
      if (data) {
        setOrder(data)

        // Force redirection to readable ID if current URL uses UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId!)
        if (isUuid && data.readable_id) {
          const newUrl = window.location.pathname + `?id=${data.readable_id}`
          window.history.replaceState(null, '', newUrl)
        }
      }
    } catch (error) {
      console.error("Failed to load order:", error)
      toast.error("Failed to load order details")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    const handleSuccess = () => toast.success("Copied to clipboard!")
    const handleFailure = () => toast.error("Failed to copy")

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(handleSuccess)
        .catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }

    function fallbackCopy(textToCopy: string) {
      try {
        const textArea = document.createElement("textarea")
        textArea.value = textToCopy
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (successful) handleSuccess()
        else handleFailure()
      } catch (err) {
        console.error('Fallback copy failed:', err)
        handleFailure()
      }
    }
  }

  // Fetch payment details for pending orders
  useEffect(() => {
    if (!order?.id || order.status !== 'pending') return

    const fetchPaymentDetails = async () => {
      setIsLoadingPayment(true)
      try {
        const payment = order.payments?.[0]
        const { getOxaPayPaymentInfo, generateOxaPayStaticAddress } = await import("@/lib/payments/oxapay")
        const { getCryptoPrice } = await import("@/lib/payments/crypto-prices")

        // START: Calculate real crypto amount
        const payCurrency = payment?.provider || 'BTC'
        const isPayPal = payCurrency === 'PayPal'

        if (isPayPal) {
          setPaymentDetails({
            address: '',
            amount: String(order.total),
            qrCodeUrl: '',
            expiresAt: new Date(order.created_at).getTime() + 3600000,
            payCurrency: 'USD',
            payLink: payment.pay_url || '',
            trackId: payment.track_id || ''
          })
          setIsLoadingPayment(false)
          return
        }

        const livePrice = await getCryptoPrice(payCurrency)
        if (livePrice) setCurrentPrice(livePrice)

        // Calculate exact amount: Total USD / Live Price
        // defaults to order total if price fetch fails, but formatted for crypto
        let calculatedCryptoAmount = String(order.total)
        if (livePrice && livePrice > 0) {
          calculatedCryptoAmount = (order.total / livePrice).toFixed(8) // Standard 8 decimals for crypto
        }
        // END: Calculate real crypto amount

        if (payment?.track_id) {
          const info = await getOxaPayPaymentInfo(payment.track_id)
          console.log("[Invoice] OxaPay Info Response:", info)
          console.log("[Invoice] Payment record:", payment)

          // Use pay_url from database, or construct fallback from track_id
          const storedPayUrl = payment.pay_url || ''
          const fallbackPayLink = `https://pay.oxapay.com/${payment.track_id}`
          // const payCurrency = info?.payCurrency || payment.provider || 'BTC' // Already defined above


          // If OxaPay has address, use it
          if (info?.address) {
            // Heuristic: If API returns exactly "1" or "1.0" for major cryptos, it's likely a placeholder/error.
            // In that case, use our calculated amount.
            const apiAmount = String(info.payAmount || "");
            const isPlaceholder = (apiAmount === "1" || apiAmount === "1.00" || apiAmount === "1.0")
              && (payCurrency.toUpperCase().includes("BTC") || payCurrency.toUpperCase().includes("BITCOIN") || payCurrency.toUpperCase().includes("ETH"));

            // Also force match if apiAmount is empty
            const finalAmount = (isPlaceholder || !apiAmount || apiAmount === "0") ? calculatedCryptoAmount : apiAmount;

            setPaymentDetails({
              address: info.address,
              amount: finalAmount,
              qrCodeUrl: info.qrCodeUrl || '',
              expiresAt: info.expiredAt ? new Date(info.expiredAt).getTime() : new Date(order.created_at).getTime() + 3600000,
              payCurrency: payCurrency,
              payLink: info?.payLink || storedPayUrl || fallbackPayLink,
              trackId: payment.track_id
            })
            return
          }

          // Try generating static address if OxaPay inquiry returned no address
          console.log("[Invoice] No address from inquiry, trying static address for:", payCurrency)
          const staticAddress = await generateOxaPayStaticAddress({
            currency: payCurrency,
            orderId: order.id,
            email: order.email,
            description: `Order ${order.readable_id}`,
          })
          console.log("[Invoice] Static address result:", staticAddress)

          if (staticAddress?.address) {
            setPaymentDetails({
              address: staticAddress.address,
              amount: calculatedCryptoAmount, // Use calculated amount here
              qrCodeUrl: staticAddress.qrCodeUrl || '',
              expiresAt: new Date(order.created_at).getTime() + 3600000,
              payCurrency: payCurrency,
              payLink: storedPayUrl || fallbackPayLink,
              trackId: payment.track_id
            })
            return
          }

          // Fallback to payLink only
          setPaymentDetails({
            address: '',
            amount: calculatedCryptoAmount, // Use calculated amount
            qrCodeUrl: '',
            expiresAt: new Date(order.created_at).getTime() + 3600000,
            payCurrency: payCurrency,
            payLink: info?.payLink || storedPayUrl,
            trackId: payment.track_id
          })
        } else {
          // No track_id yet (unlikely if pending?), use manual calc defaults
          setPaymentDetails({
            address: '',
            amount: calculatedCryptoAmount,
            qrCodeUrl: '',
            expiresAt: new Date(order.created_at).getTime() + 3600000,
            payCurrency: payCurrency,
            payLink: '',
            trackId: ''
          })
        }
      } catch (error) {
        console.error("Failed to fetch payment details:", error)
      } finally {
        setIsLoadingPayment(false)
      }
    }

    fetchPaymentDetails()
  }, [order?.id, order?.status])


  // Countdown timer for payment expiration
  useEffect(() => {
    if (!paymentDetails?.expiresAt || order?.status !== 'pending') return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = paymentDetails.expiresAt - now

      if (remaining <= 0) {
        setTimeLeft("EXPIRED")
        setPaymentStatus('expired')

        // Sync to DB if not already expired
        if (order?.status === 'pending') {
          import("@/lib/db/orders").then(({ updateOrderStatus }) => {
            updateOrderStatus(order.id, 'expired').catch(console.error)
          })
        }
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [paymentDetails?.expiresAt, order?.status])

  // Poll for payment status - FASTER 3s polling with blockchain tracking
  useEffect(() => {
    if (order?.status !== 'pending' || !paymentDetails?.trackId || payment?.provider === 'PayPal') return

    let hasShownDetectedToast = false
    let consecutiveErrors = 0

    const pollInterval = setInterval(async () => {
      try {
        // 0. Check internal DB status (Real-time sync for admin manual actions)
        const { getOrder } = await import("@/lib/db/orders")
        const currentOrder = await getOrder(order.id)
        if (currentOrder && (currentOrder.status === 'paid' || currentOrder.status === 'delivered' || currentOrder.status === 'completed')) {
          setPaymentStatus('completed')
          toast.success("Order confirmed! Finalizing...")
          clearInterval(pollInterval)
          loadOrder(false)
          return
        }

        // 1. Check OxaPay status
        const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
        const { getCryptoPrice } = await import("@/lib/payments/crypto-prices")

        const info = await getOxaPayPaymentInfo(paymentDetails.trackId)

        // 2. Fetch latest price
        const price = await getCryptoPrice(paymentDetails.payCurrency)
        if (price) setCurrentPrice(price)

        // 3. Check Blockchain directly (Real-time tracking) for instant detection
        if (paymentDetails.address) {
          const bcStatus = await trackAddressStatus(paymentDetails.address, paymentDetails.payCurrency)
          setBlockchainStatus(bcStatus)

          // If blockchain detected payment before OxaPay, show immediate feedback!
          if (bcStatus.detected && !hasShownDetectedToast) {
            hasShownDetectedToast = true
            setPaymentStatus('processing')
            toast.success("Payment detected on blockchain! Waiting for confirmations...")
          }

          if (bcStatus.status === 'confirmed' && bcStatus.txId) {
            setPaymentStatus('completed')
            toast.success("Payment Confirmed!")
            clearInterval(pollInterval)
            loadOrder(false)
            return
          }
        }

        if (info) {
          // Update address if it was missing but is now available
          if (info.address && !paymentDetails.address) {
            setPaymentDetails(prev => prev ? ({
              ...prev,
              address: info.address,
              amount: info.payAmount || prev.amount,
              qrCodeUrl: info.qrCodeUrl || prev.qrCodeUrl,
            }) : null)
          }

          if (info.status === 'Paid' || info.status === 'Confirming') {
            if (!hasShownDetectedToast) {
              hasShownDetectedToast = true
              toast.success("Payment detected! Confirming on blockchain...")
            }
            setPaymentStatus('processing')
          }
          if (info.status === 'Paid' && info.txID) {
            setPaymentStatus('completed')
            toast.success("Payment Confirmed!")
            clearInterval(pollInterval)
            loadOrder(false)
          }
          if (info.status === 'Expired' || info.status === 'Failed') {
            setPaymentStatus('expired')
            toast.error("Payment expired. Please create a new order.")
            clearInterval(pollInterval)
          }
        }
      } catch (error: any) {
        consecutiveErrors++
        const errorMsg = error?.message || String(error)
        const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')

        // Only log if it's not a transient network error OR if it has persisted for more than 5 attempts (15 seconds)
        if (!isNetworkError || consecutiveErrors > 5) {
          console.error("Error polling payment status:", error)
        }
      }
    }, 3000) // Faster 3-second polling

    return () => clearInterval(pollInterval)
  }, [order?.status, paymentDetails?.trackId, paymentDetails?.address, paymentDetails?.payCurrency])


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020406]" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-4" suppressHydrationWarning>
          <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" suppressHydrationWarning />
          <p className="text-white/40 text-xs font-black uppercase tracking-widest" suppressHydrationWarning>Loading Order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020406] p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
          <Search size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Order Not Found</h1>
          <p className="text-white/40 max-w-xs mx-auto text-sm">We couldn't find an order with this ID. Please check your link or contact support.</p>
        </div>
        <Link href="/store">
          <Button className="bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl px-8 h-12">
            Back to Store
          </Button>
        </Link>
      </div>
    )
  }

  const payment = order.payments?.[0]
  // Fixed: delivery_assets contains array of {content, type} objects
  const deliverables = order.deliveries?.flatMap((d: any) =>
    (d.delivery_assets || d.data || []).map((asset: any) =>
      typeof asset === 'string' ? asset : (asset.content || asset)
    )
  ) || []
  // Get delivery content message (for service-type products or when no assets)
  const deliveryContent = order.deliveries?.[0]?.content || null
  const hasDeliveryRecord = order.deliveries && order.deliveries.length > 0
  console.log("[Invoice] Order deliveries:", order.deliveries)
  console.log("[Invoice] Extracted deliverables:", deliverables)
  const isPaid = ['paid', 'delivered', 'completed'].includes(order.status)


  return (
    <div className="min-h-screen bg-[#020406] text-white selection:bg-brand-primary/30 antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        <div className="w-full lg:w-[35%] p-8 lg:p-12 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col justify-between border-r border-white/5 bg-background/20 backdrop-blur-3xl">
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Logo />
              </motion.div>
            </div>


            <div className="space-y-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] translate-x-1">Order Total</p>
                <div className="flex items-baseline gap-2">
                  <SparklesText
                    text={`$${order.total.toFixed(2)}`}
                    className="text-4xl font-black tracking-tighter"
                    colors={{ first: "#a4f8ff", second: "#ffffff" }}
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {order.order_items?.map((item: any, idx: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5 group hover:bg-white/[0.04] transition-all hover:border-white/10"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-background/40 group-hover:border-brand-primary/30 transition-colors shadow-2xl">
                      <Image src={item.product?.image_url || "/logo.png"} alt={item.product?.name} fill sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white truncate group-hover:text-brand-primary transition-colors">{item.product?.name}</h3>
                      {item.variant?.name && (
                        <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-0.5">{item.variant.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">{item.quantity}x</span>
                        <span className="text-[10px] text-white/40 font-bold">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4 bg-gradient-to-t from-black/20 to-transparent">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                <span className="flex items-center gap-2 ">Status</span>
                <span className={cn(
                  "tracking-normal uppercase",
                  (order.status === 'pending' && paymentStatus !== 'expired') ? "text-yellow-500" :
                    (order.status === 'paid' || order.status === 'delivered' || order.status === 'completed') ? "text-green-500" :
                      "text-red-500"
                )}>{(order.status === 'pending' && paymentStatus === 'expired') ? 'expired' : order.status}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-black tracking-widest text-white uppercase opacity-40">Total Settled</span>
                <div className="text-right">
                  <SparklesText
                    text={`$${order.total.toFixed(2)}`}
                    className="block text-2xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_15px_rgba(164,248,255,0.2)]"
                    sparklesCount={8}
                  />
                  <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">Transaction Reference: {order.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 lg:p-12 lg:px-20 bg-[#030607]/40 backdrop-blur-md relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(38,188,196,0.05),transparent_60%)] pointer-events-none" />

          {/* Steps Navigation - Synced with Checkout */}
          <div className="grid grid-cols-3 gap-6 relative z-10 mb-12 max-w-2xl mx-auto w-full">
            {[
              { s: 1, label: "Order Information" },
              { s: 2, label: "Confirm & Pay" },
              { s: 3, label: "Receive Your Items" }
            ].map((item) => {
              // For invoice page, Step 1 and 2 are always completed/active.
              // Step 3 is completed if status is paid, delivered, or completed.
              const isStep3Completed = order.status === 'paid' || order.status === 'delivered' || order.status === 'completed'
              const isActiveOrCompleted = item.s <= 2 || (item.s === 3 && isStep3Completed)

              return (
                <div key={item.s} className="space-y-3 flex-1">
                  <div className={cn(
                    "h-1 w-full rounded-full transition-all duration-1000",
                    isActiveOrCompleted ? "bg-[#a4f8ff] shadow-[0_0_15px_rgba(164,248,255,0.5)]" : "bg-white/5"
                  )} />
                  <div className="space-y-1">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      isActiveOrCompleted ? "text-[#a4f8ff]" : "text-white/20"
                    )}>Step {item.s}</p>
                    <p className={cn(
                      "text-xs font-bold tracking-tight transition-colors",
                      isActiveOrCompleted ? "text-white/90" : "text-white/20"
                    )}>{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex-1 max-w-xl w-full mx-auto flex flex-col relative z-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 pb-12"
            >

              <div className="space-y-6">
                {/* Crypto currency badge for paid orders */}
                {isPaid && payment?.provider && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center p-2 overflow-hidden">
                      {getPaymentIcon(payment.provider) ? (
                        <img src={getPaymentIcon(payment.provider)!} alt={payment.provider} className="w-full h-full object-contain" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{payment.provider}</p>
                      <p className="text-[10px] text-white/40 font-mono">{payment.track_id || order.readable_id || order.id}</p>
                    </div>
                  </div>
                )}

                {/* Metadata List - Precise Image Match Consistency */}
                <div className="space-y-4 px-2">
                  {[
                    { label: "Invoice ID", value: order.readable_id || payment?.track_id || order.id, copy: true },
                    { label: "E-mail Address", value: order.email },
                    { label: "Total Price", value: `$${Number(order.total).toFixed(2)}` },
                    ...(isPaid && paymentDetails?.amount ? [{ label: `Total Amount (${paymentDetails.payCurrency})`, value: `${paymentDetails.amount} ${paymentDetails.payCurrency}` }] : []),
                    { label: "Created At", value: new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) },
                    ...(isPaid && payment?.tx_id ? [{
                      label: "Transaction Hash",
                      value: payment.tx_id,
                      copy: true,
                      link: getExplorerUrl(payment.tx_id, payment.provider || "")
                    }] : []),
                    ...(isPaid ? [{ label: "Completed At", value: new Date(order.updated_at || order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) }] : []),
                  ].map((item: any, i) => (
                    <div key={i} className="flex items-start justify-between py-1.5 group/item">
                      <span className="text-sm font-medium text-white/40">{item.label}</span>
                      <div className="flex items-center gap-3">
                        {item.copy && (
                          <button
                            onClick={() => copyToClipboard(item.value)}
                            className="text-[#a4f8ff] hover:text-[#8ae6ed] transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#a4f8ff] hover:underline text-right truncate max-w-[200px]"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-white/90 text-right">{item.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>


                {isPaid ? (
                  <div className="space-y-8">
                    {/* SUCCESS MESSAGE - Dominant Visual Anchor */}
                    {/* SUCCESS MESSAGE - Simplified */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-xl border border-[#a4f8ff]/30 bg-[#a4f8ff]/5 flex items-center justify-center text-center"
                    >
                      <p className="text-sm font-bold text-[#a4f8ff]">Your order has been completed successfully!</p>
                    </motion.div>

                    {/* Delivered Items - shown right after success */}
                    <div className="space-y-4">
                      {(deliverables.length > 0 || hasDeliveryRecord) ? (
                        <>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-black text-[#a4f8ff] tracking-tight">Delivered Items</h2>
                          </div>

                          {order.order_items?.map((item: any, idx: number) => {
                            // Filter assets specifically for this product/variant
                            const itemAssets = order.deliveries?.flatMap((d: any) =>
                              (d.delivery_assets || d.data || []).filter((asset: any) => {
                                // Handle legacy string assets (assign to all or none? let's assign to first item if unknown)
                                if (typeof asset === 'string') return idx === 0;

                                // Match product ID
                                if (asset.product_id && asset.product_id !== item.product_id) return false;

                                // Match variant ID if present
                                if (asset.variant_id && asset.variant_id !== item.variant_id) return false;

                                // If asset has no product_id (old data), maybe show it for first item?
                                if (!asset.product_id) return idx === 0;

                                return true;
                              }).map((asset: any) => typeof asset === 'string' ? asset : (asset.content || asset))
                            ) || [];

                            return (
                              <Card key={idx} className="bg-[#0b0f1a]/40 border border-white/5 overflow-hidden rounded-2xl group/card transition-all duration-500">
                                <button
                                  onClick={() => setIsDeliveredItemsOpen(!isDeliveredItemsOpen)}
                                  className="w-full p-6 flex items-center justify-between text-left bg-[#030607]/20"
                                >
                                  <div className="space-y-1">
                                    <h3 className="text-base font-black text-white/90">
                                      {item.product?.name || item.product_name || 'Product'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.variant?.name || 'Default'}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Delivered</span>
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-white/20 transition-transform duration-500", isDeliveredItemsOpen && "rotate-180")} />
                                  </div>
                                </button>

                                <AnimatePresence>
                                  {isDeliveredItemsOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 space-y-6">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-[#a4f8ff] uppercase tracking-widest">Deliverables</span>
                                        </div>
                                        <div className="space-y-3">
                                          {itemAssets.length > 0 ? (
                                            itemAssets.map((d: any, i: number) => (
                                              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 group/code">
                                                <code className="text-sm font-medium text-white/60 tracking-tight break-all overflow-hidden text-ellipsis whitespace-nowrap">{d}</code>
                                                <Copy className="w-4 h-4 text-white/20 group-hover/code:text-[#a4f8ff] cursor-pointer transition-colors ml-4 shrink-0" onClick={() => copyToClipboard(d)} />
                                              </div>
                                            ))
                                          ) : (
                                            <div className="p-4 rounded-xl bg-background border border-white/5 flex items-center gap-3 text-white/60">
                                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                                              <span className="text-xs">Access confirmed. {item.product?.delivery_type === 'service' ? "Service active." : (deliveryContent || "Processed.")}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const content = itemAssets.join('\n')
                                              const blob = new Blob([content], { type: 'text/plain' })
                                              const url = URL.createObjectURL(blob)
                                              const a = document.createElement('a')
                                              a.href = url
                                              a.download = `deliverables-${order.id.slice(0, 8)}.txt`
                                              document.body.appendChild(a)
                                              a.click()
                                              document.body.removeChild(a)
                                              URL.revokeObjectURL(url)
                                              toast.success("Deliverables downloaded as .txt")
                                            }}
                                            className="h-10 px-4 text-[11px] font-black uppercase tracking-widest border-[#a4f8ff]/30 text-white/90 hover:bg-[#a4f8ff]/10 gap-2 rounded-xl"
                                          >
                                            Download Deliverables
                                            <Download className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              copyToClipboard(itemAssets.join('\n'))
                                              toast.success("All deliverables copied to clipboard")
                                            }}
                                            className="h-10 px-4 text-[11px] font-black uppercase tracking-widest border-[#a4f8ff]/30 text-white/90 hover:bg-[#a4f8ff]/10 gap-2 rounded-xl"
                                          >
                                            Copy Deliverables
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Card>
                            )
                          })}
                        </>
                      ) : (
                        /* Fallback when NO delivery record exists yet (Processing) */
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-4 text-center"
                        >
                          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <Download className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white">Delivery Processing</p>
                            <p className="text-[10px] text-white/40 max-w-[280px]">
                              Your order has been confirmed. If your purchase includes digital items, they will appear here shortly.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadOrder(false)}
                            className="text-[10px] border-white/10 text-white/60 hover:text-white gap-2"
                          >
                            <Loader2 className="w-3 h-3" />
                            Refresh Status
                          </Button>
                        </motion.div>
                      )}
                    </div>

                    {/* Feedback Section - Natural Next Step */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="pt-8 space-y-5"
                    >
                      {order.feedbacks && order.feedbacks.length > 0 ? (
                        <div className="space-y-6">
                          <h2 className="text-xl font-black text-[#a4f8ff] tracking-tight">Your Feedback</h2>
                          <div className="p-8 rounded-[2rem] bg-[#0b0f1a]/40 border border-white/5 space-y-8 relative overflow-hidden group">
                            <div className="absolute -top-6 -right-6 p-8 text-white/[0.02]">
                              <MessageSquareQuote size={120} />
                            </div>

                            <div className="relative z-10 space-y-8">
                              <div className="space-y-3">
                                <span className="text-xs font-black text-[#a4f8ff] uppercase tracking-widest">Rating</span>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={cn(
                                        "w-5 h-5",
                                        s <= order.feedbacks[0].rating
                                          ? "fill-[#FFD700] text-[#FFD700]"
                                          : "text-white/10"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <span className="text-xs font-black text-[#a4f8ff] uppercase tracking-widest">Message</span>
                                <p className="text-sm font-medium text-white/90 leading-relaxed uppercase">
                                  {order.feedbacks[0].message}
                                </p>
                              </div>

                              {order.feedbacks[0].admin_reply && (
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                  <span className="text-xs font-black text-[#a4f8ff] uppercase tracking-widest">Reply from {settings.general?.name || "Rainyday"}</span>
                                  <p className="text-sm font-medium text-white/60 leading-relaxed">
                                    {order.feedbacks[0].admin_reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-[#a4f8ff] tracking-tight">Leave Feedback</h2>
                              </div>
                              <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Takes 30 seconds</span>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed">Your feedback helps other buyers make confident decisions. Share your experience — ratings are the most helpful!</p>
                          </div>
                          <FeedbackForm
                            invoiceId={order.invoices?.[0]?.id || order.id}
                            orderId={order.id}
                            onSuccess={() => loadOrder(false)}
                          />
                        </>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Timer - Calm urgency, only warning near end */}
                    <div className={cn(
                      "p-4 rounded-xl flex items-center justify-between relative overflow-hidden transition-all",
                      timeLeft === "EXPIRED"
                        ? "bg-red-500/10 border border-red-500/20"
                        : parseInt(timeLeft?.split(':')[0] || '60') < 5
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : "bg-white/[0.02] border border-white/5"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          timeLeft === "EXPIRED"
                            ? "bg-red-500/20"
                            : parseInt(timeLeft?.split(':')[0] || '60') < 5
                              ? "bg-orange-500/20"
                              : "bg-brand-primary/10"
                        )}>
                          <Clock className={cn(
                            "w-4 h-4",
                            timeLeft === "EXPIRED" ? "text-red-500" :
                              parseInt(timeLeft?.split(':')[0] || '60') < 5 ? "text-orange-400 animate-pulse" : "text-brand-primary"
                          )} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Time Remaining</p>
                          <p className={cn(
                            "text-sm font-black tracking-tight",
                            timeLeft === "EXPIRED" ? "text-red-500" :
                              parseInt(timeLeft?.split(':')[0] || '60') < 5 ? "text-orange-400" : "text-white"
                          )}>{timeLeft}</p>
                        </div>
                      </div>
                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-wider">Invoice auto-expires</p>
                    </div>

                    {/* Payment Instructions */}
                    {isLoadingPayment ? (
                      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                        <p className="text-sm text-white/40">Loading payment details...</p>
                      </div>
                    ) : paymentDetails?.address ? (
                      <div className="space-y-8">
                        {/* Top Auto-Process Banner */}
                        <div className="p-4 rounded-xl bg-[#a4f8ff]/5 border border-[#a4f8ff]/10 text-center">
                          <p className="text-[11px] font-bold text-[#a4f8ff]">
                            Your order will be automatically processed once the payment is received.
                          </p>
                        </div>

                        <div className="relative pl-12 space-y-12">
                          {/* Step 1: Destination Address */}
                          <div className="relative space-y-6">
                            <div className="absolute -left-[48px] top-0 w-10 h-10 rounded-full bg-[#a4f8ff] flex items-center justify-center text-black text-sm font-black shadow-[0_0_20px_rgba(164,248,255,0.4)] z-10">
                              1
                            </div>
                            {/* Connector Line to Step 2 */}
                            <div className="absolute -left-[28px] top-10 bottom-[-48px] w-[1px] bg-[#a4f8ff]/40" />
                            <div className="space-y-1">
                              <h3 className="text-lg font-black text-white/90">You should send a payment to the following address.</h3>
                              <p className="text-sm font-medium text-white/40">You can scan the QR code.</p>
                            </div>

                            {/* QR Code Container */}
                            <div className="w-48 h-48 bg-white p-4 rounded-3xl relative group/qr overflow-hidden hover:scale-[1.02] transition-transform duration-500">
                              <Image
                                src={paymentDetails.qrCodeUrl || "/logo.png"}
                                alt="QR Code"
                                fill
                                sizes="192px"
                                className="object-contain p-2"
                              />
                              {/* Scan Line Animation */}
                              <div className="absolute left-0 right-0 h-1 bg-brand-primary/40 shadow-[0_0_20px_rgba(38,188,196,0.6)] top-0 animate-[scan_4s_linear_infinite] pointer-events-none" />
                            </div>

                            <div className="space-y-3">
                              <p className="text-sm font-medium text-white/40">Or copy the address below.</p>
                              <div
                                onClick={() => copyToClipboard(paymentDetails.address)}
                                className="flex items-center justify-between h-14 px-5 bg-[#a4f8ff] rounded-2xl cursor-pointer hover:bg-[#8ae6ed] transition-all group/addr"
                              >
                                <code className="text-sm font-bold text-black truncate max-w-[240px]">{paymentDetails.address || 'Initializing...'}</code>
                                <Copy className="w-4 h-4 text-black/60 group-hover/addr:text-black transition-colors" />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => window.open(paymentDetails.payLink, '_blank')}
                                className="w-fit h-12 px-6 border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 group/wallet font-bold uppercase tracking-widest text-[10px]"
                              >
                                Open Wallet
                                <ExternalLink className="w-4 h-4 group-hover/wallet:scale-110 transition-transform" />
                              </Button>
                            </div>
                          </div>

                          {/* Step 2: Exact Amount */}
                          <div className="relative space-y-6">
                            <div className="absolute -left-[48px] top-0 w-10 h-10 rounded-full bg-[#0b0f1a] border border-[#a4f8ff] flex items-center justify-center text-[#a4f8ff] text-sm font-black ring-1 ring-[#a4f8ff]/20">
                              2
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-black text-white/90">Make sure to send the exact amount.</h3>
                              <p className="text-sm font-medium text-white/40">You can copy it below.</p>
                            </div>
                            <div
                              onClick={() => copyToClipboard(paymentDetails.amount)}
                              className="flex items-center justify-between h-14 px-5 bg-[#a4f8ff] rounded-2xl cursor-pointer hover:bg-[#8ae6ed] transition-all group/amt w-fit min-w-[200px]"
                            >
                              <span className="text-sm font-black text-black">{paymentDetails.amount || '...'}</span>
                              <Copy className="w-4 h-4 text-black/60 group-hover/amt:text-black transition-colors ml-6" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Primary action - Pay via OxaPay */}
                        {paymentDetails?.payLink ? (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center relative z-10 shadow-2xl">
                              <Wallet className="w-8 h-8 text-brand-primary" />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <p className="text-lg font-black tracking-tighter text-white uppercase">Complete Payment</p>
                              <p className="text-[10px] font-bold text-white/30 max-w-[250px] mx-auto">Click the button below to open the secure OxaPay payment page and complete your transaction.</p>
                            </div>
                            <Button
                              onClick={() => window.open(paymentDetails.payLink, '_blank')}
                              className="w-full max-w-[280px] h-14 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 text-xs hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(38,188,196,0.4)]"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Pay with OxaPay
                            </Button>
                          </>
                        ) : order.status === 'cancelled' ? (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
                              <Ban className="w-8 h-8 text-white/20" />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <p className="text-lg font-black tracking-tighter text-white/40 uppercase">Order Cancelled</p>
                              <p className="text-[10px] font-bold text-white/30 max-w-[250px] mx-auto">This order has been cancelled and cannot be paid.</p>
                            </div>
                          </>
                        ) : (order.status === 'expired' || paymentStatus === 'expired') ? (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
                              <Clock className="w-8 h-8 text-white/20" />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <p className="text-lg font-black tracking-tighter text-white/40 uppercase">Invoice Expired</p>
                              <p className="text-[10px] font-bold text-white/30 max-w-[250px] mx-auto">This invoice has expired. Please create a new order.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-background border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
                              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <p className="text-lg font-black tracking-tighter text-white uppercase">Preparing Payment</p>
                              <p className="text-[10px] font-bold text-white/30 max-w-[250px] mx-auto">Please wait while we connect to the payment network...</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction History Tracking */}
                <AnimatePresence>
                  {paymentDetails?.address && !isPaid && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-background/40 border border-white/5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a4f8ff]">Transaction History</h4>
                          <span className="text-[8px] font-black text-[#a4f8ff]/40 uppercase tracking-widest animate-pulse">Syncing with Nodes...</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {!blockchainStatus?.detected && (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-sm font-medium text-white/40">No transactions yet...</p>
                          </div>
                        )}

                        {blockchainStatus?.detected && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Transaction</p>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-tighter",
                                "text-green-500"
                              )}>
                                DETECTED
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Confirmations</p>
                              <p className="text-[10px] font-black text-[#a4f8ff] tracking-tighter uppercase">
                                {blockchainStatus?.confirmations || 0} Block{blockchainStatus?.confirmations === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                        )}

                        {blockchainStatus?.txId && (
                          <a
                            href={
                              paymentDetails.payCurrency.includes('BTC') ? `https://mempool.space/tx/${blockchainStatus.txId}` :
                                paymentDetails.payCurrency.includes('ETH') ? `https://etherscan.io/tx/${blockchainStatus.txId}` :
                                  paymentDetails.payCurrency.includes('LTC') ? `https://live.blockcypher.com/ltc/tx/${blockchainStatus.txId}` :
                                    paymentDetails.payCurrency.includes('DOGE') ? `https://live.blockcypher.com/doge/tx/${blockchainStatus.txId}` :
                                      paymentDetails.payCurrency.includes('DASH') ? `https://live.blockcypher.com/dash/tx/${blockchainStatus.txId}` :
                                        (paymentDetails.payCurrency.includes('TRX') || paymentDetails.payCurrency.includes('TRC20')) ? `https://tronscan.org/#/transaction/${blockchainStatus.txId}` :
                                          (paymentDetails.payCurrency.includes('BNB') || paymentDetails.payCurrency.includes('BEP20')) ? `https://bscscan.com/tx/${blockchainStatus.txId}` :
                                            paymentDetails.payCurrency.includes('SOL') ? `https://solscan.io/tx/${blockchainStatus.txId}` :
                                              '#'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-white/40 hover:bg-white/10 hover:text-white transition-all group"
                          >
                            VIEW ON BLOCKCHAIN
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Return to Store - Secondary Action */}
                <div className="pt-8 mt-4 border-t border-white/5">
                  <Link href="/store" className="block">
                    <Button variant="outline" className="w-full h-11 border-white/10 text-white/60 hover:text-white hover:border-white/20 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 group">
                      <span className="text-sm">Continue Shopping</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
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
        @keyframes heartbeat {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[heartbeat_2s_ease-in-out_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#020406]">
        <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  )
}
