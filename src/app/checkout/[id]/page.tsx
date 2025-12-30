/**
 * Checkout Page - Payment Processing
 * [Cache Break: v1.0.1 - Direct Icon Registration]
 */
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Bitcoin,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Copy,
  QrCode,
  CheckCircle2,
  Star,
  Clock,
  Search,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  Lock,
  CreditCard
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/layout/logo"
import { SparklesText } from "@/components/ui/sparkles-text"
import { motion, AnimatePresence } from "framer-motion"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"
import { getOrder, updateOrderStatus } from "@/lib/db/orders"
import { safeCreateOrder, safeUpdateOrder, safeCreatePayment } from "@/lib/actions/safe-checkout"
import { createOxaPayWhiteLabel, getOxaPayPaymentInfo } from "@/lib/payments/oxapay" // Static import for reliability
import { createClient } from "@/lib/supabase/client"
import { TransactionStatus } from "@/lib/payments/blockchain-tracking"
import { Suspense } from "react"

// All OxaPay supported cryptocurrencies (exact symbols from their API)
// Re-organized crypto groups for the UI
const cryptoGroups = [
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
      { id: "usdt-trc20", name: "Tether", icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035", network: "TRC20", color: "#26A17B" },
      { id: "usdt-erc20", name: "Tether", icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035", network: "ERC20", color: "#26A17B" },
      { id: "usdc", name: "USD coin", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035", network: "ERC20", color: "#2775CA" },
      { id: "dai", name: "DAI", icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=035", network: "ERC20", color: "#F5AC37" },
    ]
  },
  {
    label: "Alt Networks",
    items: [
      { id: "sol", name: "Solana", icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035", network: "SOL", color: "#9945FF" },
      { id: "trx", name: "Tron", icon: "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035", network: "TRX", color: "#FF0013" },
      { id: "bnb", name: "BNB", icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035", network: "BSC", color: "#F3BA2F" },
      { id: "ton", name: "Toncoin", icon: "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035", network: "TON", color: "#0088CC" },
      { id: "xrp", name: "Ripple", icon: "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035", network: "XRP", color: "#23292F" },
      { id: "pol", name: "Polygon", icon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=035", network: "POL", color: "#8247E5" },
      { id: "xmr", name: "Monero", icon: "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035", network: "XMR", color: "#FF6600" },
      { id: "bch", name: "Bitcoin cash", icon: "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg?v=035", network: "BCH", color: "#8DC351" },
    ]
  },
  {
    label: "Community & Trending",
    items: [
      { id: "doge", name: "Dogecoin", icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035", network: "DOGE", color: "#C2A633" },
      { id: "shib", name: "Shiba Inu", icon: "https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=035", network: "ERC20", color: "#FFA409" },
      { id: "not", name: "Notcoin", icon: "https://cryptologos.cc/logos/notcoin-not-logo.svg?v=035", network: "TON", color: "#F5F5F5" },
      { id: "dogs", name: "DOGS", icon: "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035", network: "TON", color: "#000000" },
    ]
  }
]


const ETH_NETWORKS = [
  { id: "eth-erc20", name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", network: "ERC20", color: "#627EEA" },
  { id: "eth-base", name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", network: "BASE", color: "#0052FF" },
  { id: "eth-arb", name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", network: "ARBITRUM", color: "#28A0F0" },
  { id: "eth-opt", name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", network: "OPTIMISM", color: "#FF0420" },
]


// Get blockchain explorer URL for either a transaction ID or address
const getExplorerUrl = (idOrAddress: string, provider: string, isAddress?: boolean) => {
  if (!idOrAddress) return "#"
  const p = provider.toLowerCase()

  // If isAddress is explicitly set, use that value directly
  // Otherwise, detect if input is an address (not a tx hash) via heuristics
  let useAddress: boolean
  if (isAddress !== undefined) {
    useAddress = isAddress
  } else {
    // Heuristic detection: addresses are shorter and have specific formats
    useAddress = idOrAddress.length < 50 ||
      idOrAddress.startsWith('ltc1') || idOrAddress.startsWith('L') ||
      idOrAddress.startsWith('bc1') || idOrAddress.startsWith('1') || idOrAddress.startsWith('3') ||
      idOrAddress.startsWith('T') || // TRX
      (idOrAddress.startsWith('0x') && idOrAddress.length === 42) // ETH address
  }

  if (p.includes('btc') || p.includes('bitcoin')) {
    return useAddress ? `https://mempool.space/address/${idOrAddress}` : `https://mempool.space/tx/${idOrAddress}`
  }
  if (p.includes('eth') || p.includes('ethereum') || p.includes('erc20')) {
    return useAddress ? `https://etherscan.io/address/${idOrAddress}` : `https://etherscan.io/tx/${idOrAddress}`
  }
  if (p.includes('ltc') || p.includes('litecoin')) {
    return useAddress ? `https://live.blockcypher.com/ltc/address/${idOrAddress}` : `https://live.blockcypher.com/ltc/tx/${idOrAddress}`
  }
  if (p.includes('doge')) {
    return useAddress ? `https://live.blockcypher.com/doge/address/${idOrAddress}` : `https://live.blockcypher.com/doge/tx/${idOrAddress}`
  }
  if (p.includes('trx') || p.includes('tron') || p.includes('trc20')) {
    return useAddress ? `https://tronscan.org/#/address/${idOrAddress}` : `https://tronscan.org/#/transaction/${idOrAddress}`
  }
  if (p.includes('bnb') || p.includes('bsc') || p.includes('bep20')) {
    return useAddress ? `https://bscscan.com/address/${idOrAddress}` : `https://bscscan.com/tx/${idOrAddress}`
  }
  if (p.includes('sol') || p.includes('solana')) {
    return useAddress ? `https://solscan.io/account/${idOrAddress}` : `https://solscan.io/tx/${idOrAddress}`
  }
  if (p.includes('ton')) {
    return useAddress ? `https://tonviewer.com/${idOrAddress}` : `https://tonviewer.com/transaction/${idOrAddress}`
  }
  if (p.includes('pol') || p.includes('polygon') || p.includes('matic')) {
    return useAddress ? `https://polygonscan.com/address/${idOrAddress}` : `https://polygonscan.com/tx/${idOrAddress}`
  }
  if (p.includes('xrp') || p.includes('ripple')) {
    return useAddress ? `https://xrpscan.com/account/${idOrAddress}` : `https://xrpscan.com/tx/${idOrAddress}`
  }
  if (p.includes('xmr') || p.includes('monero')) {
    return `https://xmrchain.net/tx/${idOrAddress}` // Monero doesn't have public address explorers
  }
  if (p.includes('bch') || p.includes('bitcoin cash')) {
    return useAddress ? `https://blockchair.com/bitcoin-cash/address/${idOrAddress}` : `https://blockchair.com/bitcoin-cash/transaction/${idOrAddress}`
  }

  // Fallback
  if (idOrAddress.startsWith('0x')) return `https://etherscan.io/search?q=${idOrAddress}`
  return `https://blockchair.com/search?q=${idOrAddress}`
}

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
          // 1. Force redirection to readable ID if current URL uses UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlOrderId)
          if (isUuid && order.readable_id) {
            router.replace(`/checkout/${order.readable_id}`)
            return
          }

          if (['paid', 'delivered', 'completed', 'expired'].includes(order.status)) {
            router.push(`/invoice?id=${order.readable_id}`)
            return
          }
          setExistingOrder(order)
          setOrderId(order.readable_id)
          setEmail(order.email || "")

          // Sync cart if empty or different
          const orderItems = order.order_items.map((item: any) => {
            const product = item.product
            const variant = item.variant
            // Use variant values if available, otherwise fall back to product values
            const stockDeliveryEnabled = product?.payment_restrictions_enabled
            // When Stock & Delivery is enabled, use product-level values; otherwise use variant if available
            const effectiveSource = stockDeliveryEnabled ? product : (variant || product)

            return {
              id: item.product_id,
              variantId: item.variant_id,
              variantName: variant?.name,
              title: product?.name,
              price: item.price,
              quantity: item.quantity,
              image: product?.image_url,
              // Include stock constraints
              min_quantity: effectiveSource?.min_quantity || product?.min_quantity || 1,
              max_quantity: effectiveSource?.max_quantity || product?.max_quantity || 1000000,
              stock_count: effectiveSource?.stock_count || 0,
              is_unlimited: effectiveSource?.is_unlimited || false,
            }
          })
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
    const stockCount = item.stock_count || 0
    const isUnlimited = item.is_unlimited || false

    // Calculate effective max (consider both max_quantity and stock if not unlimited)
    const effectiveMax = isUnlimited ? maxQty : Math.min(maxQty, stockCount)

    if (delta > 0 && newQuantity > effectiveMax) {
      if (!isUnlimited && stockCount < maxQty) {
        toast.error(`Only ${stockCount} items available in stock`)
      } else {
        toast.error(`Maximum order quantity for this item is ${maxQty}`)
      }
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
  const [isEthNetworkModalOpen, setIsEthNetworkModalOpen] = React.useState(false)

  const disabledMethods = React.useMemo(() => {
    if (!existingOrder?.order_items) return []
    const disabled = new Set<string>()
    existingOrder.order_items.forEach((item: any) => {
      const productDisabled = item.product?.disabled_payment_methods || []
      productDisabled.forEach((m: string) => disabled.add(m))
    })
    return Array.from(disabled)
  }, [existingOrder])

  // Determine which crypto methods to show in the main list
  const displayCryptoItems = React.useMemo(() => {
    const getMethodName = (m: any) => (m.name === "Tether" || m.name === "USD coin" || m.name === "Ethereum") ? `${m.name} (${m.network})` : m.name

    // Filter primary items by disabled methods
    const allPrimaryItems = [...cryptoGroups[0].items]
    const primaryItems = allPrimaryItems.filter(m => !disabledMethods.includes(m.name) && !disabledMethods.includes(getMethodName(m)))

    // Check if the selected method is already in the primary group
    const isPrimary = primaryItems.some(m => getMethodName(m) === selectedMethod)

    if (selectedMethod !== "PayPal" && !isPrimary) {
      // Special case for ETH networks
      if (selectedMethod.startsWith("Ethereum")) {
        const found = ETH_NETWORKS.find(m => getMethodName(m) === selectedMethod)
        if (found && !disabledMethods.includes(found.name) && !disabledMethods.includes(getMethodName(found))) return [found, ...primaryItems]
      }

      // Find the selected method in ALL groups to be safe
      for (const group of cryptoGroups) {
        const found = group.items.find(m => getMethodName(m) === selectedMethod)
        if (found && !disabledMethods.includes(found.name) && !disabledMethods.includes(getMethodName(found))) {
          // Add the selected method to the top of our display items
          return [found, ...primaryItems]
        }
      }
    }

    return primaryItems
  }, [selectedMethod, disabledMethods])

  const [isProcessing, setIsProcessing] = React.useState(false)
  const [agreeToTerms, setAgreeToTerms] = React.useState(false)
  const [agreeToPromo, setAgreeToPromo] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [orderId, setOrderId] = React.useState("")
  const [savedTotal, setSavedTotal] = React.useState(0) // Store total before clearing cart
  const [savedItems, setSavedItems] = React.useState<any[]>([]) // Store items before clearing cart
  const [customFieldValues, setCustomFieldValues] = React.useState<Record<string, string>>({})

  // Progressive disclosure for payment methods
  const [showAllNetworks, setShowAllNetworks] = React.useState(false)
  const [isMethodModalOpen, setIsMethodModalOpen] = React.useState(false)

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null)

  // Track selected method in ref to avoid dependency loops in the effect below
  const selectedMethodRef = React.useRef(selectedMethod)
  React.useEffect(() => {
    selectedMethodRef.current = selectedMethod
  }, [selectedMethod])

  // Remember last selected payment method & handle disabled methods
  React.useEffect(() => {
    const saved = localStorage.getItem('lastPaymentMethod')
    const current = selectedMethodRef.current

    // Helper to check if a method is disabled
    const isMethodDisabled = (item: any) => {
      const name = (item.name === "Tether" || item.name === "USD coin" || item.name === "Ethereum") ? `${item.name} (${item.network})` : item.name
      return disabledMethods.includes(item.name) || disabledMethods.includes(name)
    }

    if (saved && !disabledMethods.includes(saved)) {
      // Only restore saved if we haven't already selected it (and it's not the default PayPal if saved is something else)
      if (current !== saved) {
        // Careful: check if we are just on the default "PayPal" or if the user actively changed it.
        // For now, we trust strictly restoring 'saved' if it's valid, 
        // but we must prevent overriding a user's *new* selection if this effect runs late.
        // Since this only runs on [disabledMethods], it mostly runs on load/order-load.
        setSelectedMethod(saved)
      }
    } else if (disabledMethods.includes("PayPal") || (current && disabledMethods.includes(current))) {
      // If PayPal is disabled OR our current selection is disabled, pick the first available crypto
      let firstAvailable: any = null

      for (const group of cryptoGroups) {
        const found = group.items.find(m => !isMethodDisabled(m))
        if (found) {
          firstAvailable = found
          break
        }
      }

      if (firstAvailable) {
        const getMethodName = (m: any) => (m.name === "Tether" || m.name === "USD coin" || m.name === "Ethereum") ? `${m.name} (${m.network})` : m.name
        const newMethod = getMethodName(firstAvailable)
        if (current !== newMethod) {
          setSelectedMethod(newMethod)
        }
      }
    }
  }, [disabledMethods])

  React.useEffect(() => {
    if (selectedMethod && !disabledMethods.includes(selectedMethod)) {
      localStorage.setItem('lastPaymentMethod', selectedMethod)
    }
  }, [selectedMethod, disabledMethods])

  // Promo Code State
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string
    type: 'percentage' | 'fixed'
    value: number
  } | null>(null)
  const [isCheckingCoupon, setIsCheckingCoupon] = React.useState(false)

  // Calculate totals


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
      // Pass cart product IDs for product-specific coupon validation
      const cartProductIds = cart.map(item => item.id)
      const result = await validateCoupon(couponCode, cartProductIds)

      if (result.valid && result.discount) {
        setAppliedCoupon(result.discount)
        toast.success(result.message || "Coupon applied!")
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

  // -- Persistence Logic --
  // 1. Restore state on mount
  React.useEffect(() => {
    if (!urlOrderId) return
    try {
      const saved = localStorage.getItem(`checkout_sess_${urlOrderId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.step && parsed.step > 1) {
          setSavedItems(parsed.savedItems || [])
          setSavedTotal(parsed.savedTotal || 0)
          setCryptoDetails(parsed.cryptoDetails)
          setStep(parsed.step)
        }
      }
    } catch (e) {
      console.error("Failed to restore checkout session:", e)
    }
  }, [urlOrderId])

  // 2. Save state when changed (only for step 2+)
  React.useEffect(() => {
    if (!urlOrderId || step === 1) return
    const state = {
      step,
      cryptoDetails,
      savedItems,
      savedTotal
    }
    localStorage.setItem(`checkout_sess_${urlOrderId}`, JSON.stringify(state))
  }, [step, cryptoDetails, savedItems, savedTotal, urlOrderId])

  // Countdown timer for payment expiration (1 hour from order creation)
  const [timeLeft, setTimeLeft] = React.useState<string>("--:--")
  const [isExpired, setIsExpired] = React.useState(false)

  React.useEffect(() => {
    // Use order creation time + 1 hour, or fallback to crypto expiry
    const orderCreatedAt = existingOrder?.created_at ? new Date(existingOrder.created_at).getTime() : null
    const expiryTime = orderCreatedAt ? orderCreatedAt + (60 * 60 * 1000) : cryptoDetails?.expiresAt

    if (!expiryTime || step !== 2) return

    const updateTimer = async () => {
      const now = Date.now()
      const remaining = expiryTime - now

      if (remaining <= 0) {
        setTimeLeft("EXPIRED")
        setIsExpired(true)

        // Mark order as expired if it hasn't been paid
        if (orderId && existingOrder?.status === 'pending') {
          try {
            await updateOrderStatus(orderId, 'expired')
            toast.error("This invoice has expired. Please create a new order.")
          } catch (error) {
            console.error("Failed to mark order as expired:", error)
          }
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
  }, [existingOrder?.created_at, cryptoDetails?.expiresAt, step, orderId, existingOrder?.status])

  React.useEffect(() => {
    // Only redirect to store if cart is truly empty AND we are NOT processing an order 
    // AND we aren't already viewing an existing order (step 2 or existing order URL)
    if (isHydrated && cart.length === 0 && step === 1 && !isProcessing && urlOrderId === 'new') {
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
      // Handle $0.00 orders FIRST (100% discount from coupons or free products)
      // Skip payment entirely and deliver directly
      if (finalTotal === 0) {
        const { completeFreeOrder } = await import("@/lib/actions/checkout")
        const items = cart.filter(i => i.quantity > 0).map(item => ({
          product_id: item.id,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          price: item.price
        }))
        const customFields = customFieldValues

        let result;
        if (existingOrder) {
          result = await safeUpdateOrder(existingOrder.id, {
            email,
            total: 0,
            items,
            custom_fields: customFields
          })
        } else {
          result = await safeCreateOrder({
            email,
            total: 0,
            items,
            custom_fields: customFields
          })
        }

        if (!result.success) {
          console.error("[CHECKOUT] Free order creation failed:", result.error, result.details)
          throw new Error(result.error)
        }

        const order = result.data
        const resolution = await completeFreeOrder(order.id, appliedCoupon?.code)
        if (resolution.success) {
          clearCart()
          toast.delivery("🎉 Order completed! Your items are being delivered.")
          router.push(`/invoice?id=${order.readable_id || order.id}`)
          return
        } else {
          throw new Error(resolution.error)
        }
      }

      // Payment logic for non-zero amounts
      const isPayPal = selectedMethod === "PayPal"
      const isCrypto = !isPayPal && selectedMethod !== "Customer Balance"

      // Minimum amount validation for payment gateways
      const MINIMUM_AMOUNTS = {
        paypal: 1.00,   // PayPal/Paylix minimum is $1.00
        crypto: 0.50,   // OxaPay minimum is approximately $0.50
      }

      if (isPayPal && finalTotal < MINIMUM_AMOUNTS.paypal) {
        toast.error(`Minimum order amount for PayPal is $${MINIMUM_AMOUNTS.paypal.toFixed(2)}. Please add more items to your cart.`)
        setIsProcessing(false)
        return
      }

      if (isCrypto && finalTotal < MINIMUM_AMOUNTS.crypto) {
        toast.error(`Minimum order amount for crypto payments is $${MINIMUM_AMOUNTS.crypto.toFixed(2)}. Please add more items to your cart.`)
        setIsProcessing(false)
        return
      }

      // 1. Create or Update the Order in Supabase
      const total = finalTotal
      const items = cart.filter(i => i.quantity > 0).map(item => ({
        product_id: item.id,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: item.price
      }))
      const customFields = customFieldValues

      // Note: $0 orders are handled at the start of handleProceedToPayment
      // before minimum amount validation

      // Pass total directly.
      let orderResult;
      if (existingOrder) {
        orderResult = await safeUpdateOrder(existingOrder.id, {
          email,
          total,
          items,
          custom_fields: customFields
        })
      } else {
        orderResult = await safeCreateOrder({
          email,
          total,
          items,
          custom_fields: customFields
        })
      }

      if (!orderResult.success) {
        console.error("[CHECKOUT] Order creation failed:", orderResult.error, orderResult.details)
        toast.error(`Order Failed: ${orderResult.error}`)
        setIsProcessing(false)
        return
      }

      const order = orderResult.data
      setOrderId(order.readable_id)

      // 2. Handle PayPal (Paylix) or Crypto (OxaPay)
      if (isPayPal || isCrypto) {
        // Map payment method to OxaPay currency codes
        const payCurrencyMap: Record<string, string> = {
          "Bitcoin": "BTC",
          "Ethereum": "ETH",
          "Litecoin": "LTC",
          "Tether": "USDT",
          "Tron": "TRX",
          "Dogecoin": "DOGE",
          "Bitcoin cash": "BCH",
          "BNB": "BNB",
          "Solana": "SOL",
          "USDC": "USDC",
          "TON": "TON",
          "Polygon": "POL", // OxaPay uses POL, not MATIC
          "Monero": "XMR",
          "Shiba Inu": "SHIB",
          "DAI": "DAI",
          "Notcoin": "NOT",
          "DOGS": "DOGS",
          "Ripple": "XRP",
          "Toncoin": "TON",
          "USD coin": "USDC",
        }
        if (isPayPal) {
          const { createPaylixPayment } = await import("@/lib/payments/paylix")
          const response = await createPaylixPayment({
            title: `Order ${order.readable_id} from Rainyday`,
            value: total,
            currency: "USD",
            email: email,
            gateway: "PAYPAL",
            return_url: `${window.location.origin}/invoice?id=${order.readable_id}`,
            webhook: `${window.location.origin}/api/webhooks/paylix`,
          })

          // Sync URL so refresh doesn't lose the order
          if (urlOrderId === 'new') {
            window.history.replaceState(null, '', `/checkout/${order.readable_id}`)
          }

          // 3. Create the Payment record
          const payResult = await safeCreatePayment({
            order_id: order.id,
            provider: "PayPal",
            amount: total,
            currency: "USD",
            track_id: response.uniqid,
            pay_url: response.url
          })

          if (!payResult.success) {
            console.error("[CHECKOUT] Payment creation failed:", payResult.error)
            // Proceed anyway since we have the URL? No, safer to fail.
            throw new Error(payResult.error)
          }

          // 4. Redirect to Paylix
          clearCart()
          toast.success("Redirecting to PayPal...")
          window.location.href = response.url
          return
        }

        // 2b. Create the OxaPay Invoice (existing flow)
        // const { createOxaPayWhiteLabel } = await import("@/lib/payments/oxapay") // Using static import

        // Parse network from selectedMethod if present
        let payNetwork: string | undefined = undefined
        let baseMethodName = selectedMethod

        if (selectedMethod.includes("(") && selectedMethod.includes(")")) {
          const match = selectedMethod.match(/\(([^)]+)\)/)
          if (match) {
            payNetwork = match[1]
            baseMethodName = selectedMethod.split(" (")[0]
          }
        }

        const response = await createOxaPayWhiteLabel({
          amount: total,
          currency: "USD",
          payCurrency: payCurrencyMap[baseMethodName] || "BTC",
          network: payNetwork,
          orderId: order.readable_id,
          description: `Order ${order.readable_id} from Rainyday`,
          email: email,
          callbackUrl: `${window.location.origin}/api/webhooks/oxapay`,
          returnUrl: `${window.location.origin}/invoice?id=${order.readable_id}`,
        })

        console.log("[Checkout] OxaPay Response:", response)

        // 3. Create the Payment record with OxaPay track ID, pay_url, and crypto address
        const payResult = await safeCreatePayment({
          order_id: order.id,
          provider: payCurrencyMap[selectedMethod] || "Crypto",
          amount: total,
          currency: "USD",
          track_id: response.trackId,
          pay_url: response.payLink,
          crypto_address: response.address || null
        })

        if (!payResult.success) {
          console.error("[CHECKOUT] Payment creation failed:", payResult.error)
          throw new Error(payResult.error)
        }

        // 4. Check if we need to redirect (white-label not available)
        if (response.isRedirect && response.payLink) {
          // Don't clear cart here - it will be cleared on return
          // Redirect directly to the payment provider
          window.location.href = response.payLink
          return
        }

        // Calculate real crypto amount using live exchange rates
        let finalCryptoAmount = response.amount
        let exchangeRate = 0
        const selectedCrypto = payCurrencyMap[selectedMethod] || "BTC"

        // If OxaPay didn't return a proper crypto amount...
        if (true) {
          const { convertUsdToCrypto } = await import("@/lib/payments/crypto-prices")
          const conversion = await convertUsdToCrypto(total, selectedCrypto)
          if (conversion) {
            if (!finalCryptoAmount || finalCryptoAmount === String(total) || finalCryptoAmount === "1" || finalCryptoAmount === "1.00" || finalCryptoAmount === "0" || parseFloat(finalCryptoAmount) === 0) {
              finalCryptoAmount = conversion.cryptoAmount
            }
            exchangeRate = conversion.usdPrice
          }
        }

        // 5. Update local state for step 2
        setCryptoDetails({
          address: response.address || "Error generating address",
          amount: finalCryptoAmount || "0.00000000",
          invoiceId: response.trackId,
          qrCodeUrl: (response as any).qrcode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${response.address}`,
          expiresAt: Date.now() + 30 * 60 * 1000, // 30 mins
          payCurrency: selectedCrypto,
          payLink: response.payLink,
          exchangeRate
        })

        setSavedTotal(total)
        setSavedItems(cart)

        // Sync URL so refresh doesn't lose the order
        if (urlOrderId === 'new') {
          window.history.replaceState(null, '', `/checkout/${order.readable_id}`)
        }

        setStep(2)
        clearCart()
        toast.info("🚀 Order created! Awaiting your payment...")
        return
      }

      // Normal flow for other methods if any
      const finalOrderId = order?.readable_id || orderId
      setSavedTotal(finalTotal)
      setSavedItems(cart)
      clearCart()
      router.push(`/invoice?id=${finalOrderId}`)
    } catch (error: any) {
      console.error("Payment Error:", error)
      toast.error(error.message || "Failed to initialize payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Poll for payment status
  const [paymentStatus, setPaymentStatus] = React.useState<'pending' | 'processing' | 'completed' | 'expired'>('pending')
  const [blockchainStatus, setBlockchainStatus] = React.useState<TransactionStatus | null>(null)

  // Effect to handle Realtime status updates
  React.useEffect(() => {
    if (!existingOrder?.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`order_status_${existingOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${existingOrder.id}`
        },
        (payload: any) => {
          const newStatus = payload.new.status
          if (['paid', 'delivered', 'completed'].includes(newStatus)) {
            setPaymentStatus('completed')
            toast.payment("🎉 Payment confirmed!")
            setTimeout(() => {
              router.push(`/invoice?id=${orderId || existingOrder.readable_id}`)
            }, 1000)
          } else if (newStatus === 'expired') {
            setPaymentStatus('expired')
            toast.error("Order expired.")
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `order_id=eq.${existingOrder.id}`
        },
        (payload: any) => {
          const payment = payload.new
          if (payment?.tx_id && !blockchainStatus?.txId) {
            setBlockchainStatus({
              detected: true,
              txId: payment.tx_id,
              status: payment.status === 'completed' ? 'confirmed' : 'detected',
              confirmations: payment.payload?.confirmations || 0,
              lastCheck: new Date(),
              timestamp: Date.now() / 1000
            })
            if (paymentStatus === 'pending') {
              setPaymentStatus('processing')
              toast.info("📡 Payment detected! Confirming...")
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [existingOrder?.id, orderId, router])

  // Effect to poll for payment status when on step 2 - FASTER polling with blockchain tracking
  React.useEffect(() => {
    if (step !== 2 || !orderId || paymentStatus !== 'pending') return

    let hasShownDetectedToast = false
    let hasShownExpiredToast = false
    let hasCompleted = false
    let consecutiveErrors = 0
    let pollCount = 0

    // Small delay before first poll to let Realtime kick in if possible
    const pollInterval = setInterval(async () => {
      // Skip if already completed or expired
      if (hasCompleted || hasShownExpiredToast) return

      try {
        pollCount++
        // 1. & 2. PARALLEL EXECUTION: Check both simultaneously for speed
        const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
        const { trackAddressStatus } = await import("@/lib/payments/blockchain-tracking")

        // Prepare promises
        const oxaPayPromise = getOxaPayPaymentInfo(cryptoDetails?.invoiceId || '')

        let blockchainPromise = Promise.resolve(null as any)
        if (cryptoDetails?.address && cryptoDetails.payCurrency) {
          const minTimestamp = existingOrder?.created_at ? Math.floor(new Date(existingOrder.created_at).getTime() / 1000) : undefined
          blockchainPromise = trackAddressStatus(cryptoDetails.address, cryptoDetails.payCurrency, minTimestamp)
        }

        // Execute in parallel (OxaPay, Blockchain, and occasional DB fallback)
        const [info, bcStatus, currentOrder] = await Promise.all([
          oxaPayPromise,
          blockchainPromise,
          // 0. Occasional DB check (every 10s at 2s interval) as a fallback for Realtime
          pollCount % 5 === 0 ? getOrder(orderId) : Promise.resolve(null)
        ])

        if (currentOrder) {
          if (['paid', 'delivered', 'completed'].includes(currentOrder.status)) {
            hasCompleted = true
            setPaymentStatus('completed')
            toast.payment("✅ Order confirmed! Processing your delivery...")
            clearInterval(pollInterval)
            setTimeout(() => {
              router.push(`/invoice?id=${orderId}`)
            }, 1000)
            return
          } else if (currentOrder.status === 'processing') {
            setPaymentStatus('processing')
          } else if (currentOrder.status === 'expired') {
            setPaymentStatus('expired')
            clearInterval(pollInterval)
          }
        }

        // Handle Blockchain Result
        if (bcStatus) {
          setBlockchainStatus(bcStatus)

          // If blockchain detected payment before OxaPay, show it!
          if (bcStatus.detected && !hasShownDetectedToast) {
            hasShownDetectedToast = true
            setPaymentStatus('processing')
            toast.info("📡 Payment detected on blockchain! Waiting for confirmations...")

            // ACTIVE SYNC: Trigger server update immediately on detection
            try {
              const { verifyBlockchainPayment } = await import("@/lib/actions/verify-blockchain-payment")
              // Verify will update DB to 'processing' if 0 confs, or 'completed' if confirmed
              if (cryptoDetails) {
                const minTimestamp = existingOrder?.created_at ? Math.floor(new Date(existingOrder.created_at).getTime() / 1000) : undefined
                await verifyBlockchainPayment(existingOrder?.payments?.[0]?.id || '', cryptoDetails.address, cryptoDetails.payCurrency, parseFloat(cryptoDetails.amount), minTimestamp)
              }
            } catch (err) {
              console.error("Failed to sync detected status:", err)
            }
          }

          // When blockchain shows sufficient confirmations (2+), complete the order
          // Don't wait for OxaPay - trust the blockchain as the source of truth
          if (bcStatus.status === 'confirmed' && bcStatus.confirmations >= 2 && !hasCompleted) {
            // Re-verify to ensure DB is updated to 'completed'
            try {
              const { verifyBlockchainPayment } = await import("@/lib/actions/verify-blockchain-payment")
              if (cryptoDetails) {
                const minTimestamp = existingOrder?.created_at ? Math.floor(new Date(existingOrder.created_at).getTime() / 1000) : undefined
                const result = await verifyBlockchainPayment(existingOrder?.payments?.[0]?.id || '', cryptoDetails.address, cryptoDetails.payCurrency, parseFloat(cryptoDetails.amount), minTimestamp)

                if (result.success && result.status === 'confirmed') {
                  hasCompleted = true
                  setPaymentStatus('completed')
                  toast.payment("✅ Blockchain confirmed! Processing delivery...")
                  clearInterval(pollInterval)
                  setTimeout(() => {
                    router.push(`/invoice?id=${orderId}`)
                  }, 500)
                  return
                }
              }
            } catch (err) {
              console.error("Failed to sync confirmed status:", err)
            }
          }
        }

        // Handle OxaPay Result
        if (info) {
          if (info.status === 'Paid' || info.status === 'Confirming') {
            if (!hasShownDetectedToast && !hasCompleted) {
              hasShownDetectedToast = true
              toast.info("📡 Payment detected! Confirming on blockchain...")
            }
            setPaymentStatus('processing')
          }
          if (info.status === 'Paid' && info.txID && !hasCompleted) {
            hasCompleted = true
            // ACTIVE SYNC: Trigger server update immediately
            try {
              const { markOrderAsPaid } = await import("@/lib/actions/checkout")
              // We pass the txID, and the server action will RE-VERIFY it before marking paid
              await markOrderAsPaid(existingOrder?.id || '', info.txID, {
                address: cryptoDetails?.address,
                currency: cryptoDetails?.payCurrency
              })
            } catch (err) {
              console.error("Failed to sync paid status:", err)
            }

            setPaymentStatus('completed')
            toast.payment("🎉 Payment Confirmed! Redirecting...")
            clearInterval(pollInterval)
            setTimeout(() => {
              router.push(`/invoice?id=${orderId}`)
            }, 500)
          }
          if ((info.status === 'Expired' || info.status === 'Failed') && !hasShownExpiredToast) {
            hasShownExpiredToast = true
            clearInterval(pollInterval)
            setPaymentStatus('expired')
            toast.error("Payment expired. Please try again.")
          }
        }
        consecutiveErrors = 0
      } catch (error: any) {
        consecutiveErrors++
        const errorMsg = error?.message || String(error)
        const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')

        // Silent retry for network errors up to 5 times (15 seconds)
        if (!isNetworkError || consecutiveErrors > 5) {
          console.error("Error polling payment status:", error)
        }
      }
    }, 2000) // Polling interval set to 2s since we have Realtime as primary

    return () => clearInterval(pollInterval)
  }, [step, orderId, cryptoDetails?.invoiceId, cryptoDetails?.address, cryptoDetails?.payCurrency, router, existingOrder, paymentStatus])

  const handleCheckPaymentStatus = async () => {
    setIsProcessing(true)
    try {
      const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
      const info = await getOxaPayPaymentInfo(cryptoDetails?.invoiceId || '')
      if (info) {
        if (info.status === 'Paid' || info.status === 'Confirming') {
          setPaymentStatus('processing')
          toast.info("📡 Payment detected! Confirming on blockchain...")
        }
        if (info.status === 'Paid' && info.txID) {
          setPaymentStatus('completed')
          toast.payment("🎉 Payment Confirmed! Redirecting...")
          setTimeout(() => {
            router.push(`/invoice?id=${orderId}`)
          }, 500)
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
    if (!text) {
      toast.error("Nothing to copy")
      return
    }

    // Create a visible input at bottom of screen (mobile requires visibility)
    const input = document.createElement('input')
    input.value = text
    input.style.position = 'fixed'
    input.style.bottom = '0'
    input.style.left = '0'
    input.style.width = '100%'
    input.style.height = '1px'
    input.style.opacity = '0.01'
    input.style.zIndex = '9999'
    input.style.fontSize = '16px'

    document.body.appendChild(input)
    input.focus()
    input.select()

    const success = document.execCommand('copy')
    document.body.removeChild(input)

    if (success) {
      toast.success("Copied!")
    } else {
      toast.error("Copy failed - please select manually")
    }
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
        <div className="w-full lg:w-[35%] p-4 md:p-6 lg:p-8 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 bg-background/20 backdrop-blur-3xl">
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Logo />
              </motion.div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] translate-x-1">Pay Rainyday</p>
                <div className="flex items-baseline gap-2">
                  <SparklesText
                    text={formatPrice(finalTotal)}
                    className="text-3xl font-black tracking-tighter"
                    colors={{ first: "#a4f8ff", second: "#ffffff" }}
                  />
                  {savedTotal > 0 && appliedCoupon && (
                    <span className="text-lg font-bold text-white/40 line-through decoration-white/20 decoration-2">
                      {formatPrice(savedTotal)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-[30vh] lg:max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {(savedItems.length > 0 ? savedItems : cart).map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 group hover:bg-white/[0.04] transition-all hover:border-white/10"
                    >
                      <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                        <Image src={item.image || "/logo.png"} alt={item.title || "Product"} fill sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">{item.title}</h3>
                        {item.variantName && (
                          <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-0.5">{item.variantName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {savedItems.length > 0 ? null : (
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
                          )}
                          {/* Increased spacing for cart safety */}
                          {!savedItems.length && <div className="ml-2">
                            {pendingDelete === item.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(item, -item.quantity);
                                    setPendingDelete(null);
                                    toast.info(`Removed ${item.title}`);
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white text-[8px] font-black rounded-md hover:bg-red-600 transition-colors uppercase tracking-wider"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDelete(null);
                                  }}
                                  className="px-2 py-1 bg-white/10 text-white/60 text-[8px] font-black rounded-md hover:bg-white/20 transition-colors uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingDelete(item.id);
                                }}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>}
                        </div>
                      </div>
                      <div className="text-right">
                        {savedItems.length === 0 && (
                          <p className="text-xs font-black text-white group-hover:text-brand-primary transition-colors">{formatPrice(item.price * item.quantity)}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            {/* Subtotal Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/40">Subtotal</span>
              <span className="text-sm text-white/60">{formatPrice(subtotal)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-400">Discount <span className="text-white/30">({appliedCoupon.code})</span></span>
                <span className="text-sm text-emerald-400">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            {/* Processing Fee Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/30">Processing Fee</span>
              <span className="text-sm text-white/40">$0.00</span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5" />

            {/* Total Row */}
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-white">Total</span>
              <SparklesText
                text={formatPrice(finalTotal)}
                className="text-2xl font-bold text-white"
                sparklesCount={8}
              />
            </div>
          </div>

        </div>

        {/* Right Panel - Steps & Payment */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 lg:px-12 bg-[#030607]/40 backdrop-blur-md relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(38,188,196,0.05),transparent_60%)] pointer-events-none" />

          {/* Steps Navigation */}
          <div className="grid grid-cols-3 gap-6 relative z-10 mb-8 max-w-2xl mx-auto w-full">
            {[
              { s: 1, label: "Order Information" },
              { s: 2, label: "Confirm & Pay" },
              { s: 3, label: "Receive Your Items" }
            ].map((item) => {
              const isActiveOrCompleted = step >= item.s
              const isCurrent = step === item.s
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
            <AnimatePresence mode="wait">
              {/* Step 1 Content: Order Details */}
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pb-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-white/90">E-mail Address *</label>
                      </div>
                      <div className="relative group">
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="The order confirmation will be sent to this e-mail address."
                          className="h-11 px-6 bg-white/[0.03] border-white/5 rounded-xl focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-sm focus-visible:ring-0 focus-visible:border-white/5"
                        />
                        <div className="absolute inset-0 rounded-xl border border-white/0 group-focus-within:border-[#a4f8ff] group-focus-within:ring-4 group-focus-within:ring-[#a4f8ff]/10 pointer-events-none transition-all" />
                      </div>
                    </div>

                    {settings.checkout.show_coupon && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-white/90">Coupon Code</label>
                        </div>
                        <div className="relative group">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Have a discount? Enter it here."
                            disabled={!!appliedCoupon || isCheckingCoupon}
                            className={cn(
                              "h-11 px-6 pr-28 bg-white/[0.03] border-white/5 rounded-xl focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-sm focus-visible:ring-0 focus-visible:border-white/5",
                              appliedCoupon && "border-[#a4f8ff]/40 text-[#a4f8ff]"
                            )}
                          />
                          <div className="absolute inset-0 rounded-xl border border-white/0 group-focus-within:border-[#a4f8ff] group-focus-within:ring-4 group-focus-within:ring-[#a4f8ff]/10 pointer-events-none transition-all" />
                          {appliedCoupon ? (
                            <button
                              onClick={() => {
                                setAppliedCoupon(null)
                                setCouponCode("")
                              }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-transparent border border-red-400/40 hover:border-red-400 hover:bg-red-400/10 transition-all rounded-lg text-[9px] font-bold text-red-400 flex items-center gap-2 active:scale-95 uppercase tracking-widest"
                            >
                              Remove
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={handleApplyCoupon}
                              disabled={isCheckingCoupon || !couponCode}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-transparent border border-[#a4f8ff]/40 hover:border-[#a4f8ff] hover:bg-[#a4f8ff]/10 transition-all rounded-lg text-[9px] font-bold text-[#a4f8ff] flex items-center gap-2 active:scale-95 uppercase tracking-widest disabled:opacity-50"
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
                                      className="h-11 px-6 bg-white/[0.03] border-white/5 rounded-xl focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-white font-bold text-sm focus-visible:ring-0 focus-visible:border-white/5"
                                    />
                                    <div className="absolute inset-0 rounded-xl border border-white/0 group-focus-within:border-[#a4f8ff] group-focus-within:ring-4 group-focus-within:ring-[#a4f8ff]/10 pointer-events-none transition-all" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4 px-1 pb-1">
                      <div className="flex items-center justify-between pb-1">
                        <label className="text-sm font-medium text-white/90">Payment Method *</label>
                      </div>

                      <div className="space-y-3">
                        {/* Primary Method - PayPal */}
                        {!disabledMethods.includes("PayPal") && (
                          <div
                            onClick={() => setSelectedMethod("PayPal")}
                            className={cn(
                              "p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group h-[64px]",
                              selectedMethod === "PayPal"
                                ? "bg-brand-primary/5 border-brand-primary"
                                : "bg-white/[0.02] border-white/5 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors overflow-hidden p-2",
                                selectedMethod === "PayPal" ? "bg-[#003087]/10" : "bg-white/5 group-hover:bg-white/10"
                              )}>
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg"
                                  alt="PayPal"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-bold text-white">PayPal</span>
                                <span className="text-[11px] text-white/40">Secure instant payment</span>
                              </div>
                            </div>
                            <div className="h-6 w-16 opacity-30">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal Text" className="w-full h-full object-contain brightness-0 invert" />
                            </div>
                          </div>
                        )}

                        {/* Dynamic Crypto Section */}
                        <div className="space-y-3">
                          {displayCryptoItems.map((method) => {
                            const methodName = (method.name === "Tether" || method.name === "USD coin" || method.name === "Ethereum") ? `${method.name} (${method.network})` : method.name
                            const isSelected = selectedMethod === methodName

                            return (
                              <div
                                key={method.id + method.network}
                                onClick={() => {
                                  if (method.name === "Ethereum") {
                                    setIsEthNetworkModalOpen(true)
                                  } else {
                                    setSelectedMethod(methodName)
                                  }
                                }}
                                className={cn(
                                  "relative flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer group transition-all duration-200",
                                  isSelected
                                    ? "bg-white/[0.05] border border-[#a4f8ff] ring-4 ring-[#a4f8ff]/10"
                                    : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                                )}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[15px] font-bold text-white">{method.name}</span>
                                    {method.id === "ltc" && (
                                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                        <span className="text-[8px] font-bold text-yellow-400 uppercase">Popular</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{method.network}</span>
                                </div>

                                <div className="w-8 h-8 flex items-center justify-center p-1.5 bg-white/5 rounded-lg transition-transform duration-300 group-hover:scale-110">
                                  <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                                </div>

                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-[#a4f8ff] absolute -right-1 -top-1 bg-[#020406] rounded-full animate-in zoom-in duration-200" />
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Show More Button - Opens Modal */}
                        <button
                          onClick={() => setIsMethodModalOpen(true)}
                          className="w-full py-3 px-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest group"
                        >
                          <span>Show more</span>
                          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                      </div>

                      <div className="pt-2 space-y-2">
                        {[
                          { label: "I have read and agree to Rainyday's Terms of Service.", state: agreeToTerms, setter: setAgreeToTerms, show: settings.checkout.show_terms },
                          { label: "I would like to receive updates and promotions from Rainyday.", state: agreeToPromo, setter: setAgreeToPromo, show: settings.checkout.show_newsletter }
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
                                "w-5 h-5 rounded border transition-all flex items-center justify-center relative z-10",
                                check.state ? "bg-[#a4f8ff] border-[#a4f8ff]" : "bg-white/[0.02] border-white/10 group-hover:border-white/20"
                              )}>
                                {check.state && <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />}
                              </div>
                            </div>
                            <span className={cn(
                              "text-xs transition-colors",
                              check.state ? "text-white" : "text-white/40 group-hover:text-white/60"
                            )}>{check.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>



                  {/* Simple CTA Button */}
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isProcessing || isLoadingOrder}
                    className="w-full h-11 bg-[#a4f8ff] hover:bg-[#8ae6ed] active:bg-[#70d4db] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <>
                        <span>Proceed to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  {/* Top Auto-Process Banner */}
                  <div className="p-4 rounded-xl bg-[#a4f8ff]/5 border border-[#a4f8ff]/10 text-center">
                    <p className="text-[11px] font-bold text-[#a4f8ff]">
                      Your order will be automatically processed once the payment is received.
                    </p>
                  </div>

                  {/* Payment Timer */}
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

                  {/* Order Info Summary */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    {/* Crypto Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#a4f8ff]/10 flex items-center justify-center">
                        {cryptoDetails?.payCurrency && (
                          <img
                            src={`https://cryptologos.cc/logos/${cryptoDetails.payCurrency === 'BTC' ? 'bitcoin-btc' :
                              cryptoDetails.payCurrency === 'ETH' ? 'ethereum-eth' :
                                cryptoDetails.payCurrency === 'LTC' ? 'litecoin-ltc' :
                                  cryptoDetails.payCurrency === 'USDT' ? 'tether-usdt' :
                                    cryptoDetails.payCurrency === 'SOL' ? 'solana-sol' :
                                      cryptoDetails.payCurrency === 'TRX' ? 'tron-trx' :
                                        cryptoDetails.payCurrency === 'DOGE' ? 'dogecoin-doge' :
                                          cryptoDetails.payCurrency === 'XMR' ? 'monero-xmr' :
                                            cryptoDetails.payCurrency === 'TON' ? 'toncoin-ton' :
                                              cryptoDetails.payCurrency.toLowerCase()
                              }-logo.svg?v=035`}
                            alt={cryptoDetails.payCurrency}
                            className="w-6 h-6"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{cryptoDetails?.payCurrency || 'Crypto'}</p>
                        <p className="text-[10px] font-medium text-white/40 truncate max-w-[200px]">{orderId || urlOrderId}</p>
                      </div>
                    </div>

                    {/* Info Rows */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">Invoice ID</span>
                        <span className="text-xs font-medium text-white/60 flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{orderId || urlOrderId}</span>
                          <button onClick={() => copyToClipboard(orderId || urlOrderId || '')} className="hover:text-[#a4f8ff] transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">E-mail Address</span>
                        <span className="text-xs font-medium text-white/60">{email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">Total Price</span>
                        <span className="text-xs font-bold text-white">{formatPrice(savedTotal || cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">Total Amount ({cryptoDetails?.payCurrency})</span>
                        <span className="text-xs font-bold text-[#a4f8ff]">{cryptoDetails?.amount} {cryptoDetails?.payCurrency}</span>
                      </div>
                      {blockchainStatus?.txId && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-white/40">Transaction Hash</span>
                          <span className="text-xs font-medium text-white/60 flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{blockchainStatus.txId}</span>
                            <button onClick={() => copyToClipboard(blockchainStatus.txId || "")} className="hover:text-[#a4f8ff] transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
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

                      {/* Delivery Notice */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-brand-primary/10 to-transparent border border-brand-primary/10 flex items-center gap-4 group/delivery-note relative overflow-hidden">
                        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover/delivery-note:opacity-100 transition-opacity duration-500" />
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 relative z-10 border border-brand-primary/20">
                          <ShieldCheck className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-[11px] font-black text-[#a4f8ff] uppercase tracking-widest mb-0.5">Instant Delivery Information</p>
                          <p className="text-xs font-medium text-white/60">Product will be delivered after <span className="text-white font-bold">2 confirmations</span> on the blockchain.</p>
                        </div>
                      </div>

                      {/* QR Code Container */}
                      <div className="w-48 h-48 bg-white p-4 rounded-3xl relative group/qr overflow-hidden hover:scale-[1.02] transition-transform duration-500">
                        <Image
                          src={cryptoDetails?.qrCodeUrl || "/logo.png"}
                          alt="QR Code"
                          fill
                          sizes="192px"
                          className="object-contain p-2"
                        />
                        {/* Subtle Scan Line */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#a4f8ff]/0 via-[#a4f8ff]/20 to-[#a4f8ff]/0 h-1 top-0 animate-[scan_4s_linear_infinite] pointer-events-none" />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-white/40">Or copy the address below.</p>
                        <div className="flex items-stretch w-full">
                          <textarea
                            readOnly
                            value={cryptoDetails?.address || 'Initializing...'}
                            rows={2}
                            className="flex-1 py-3 px-4 bg-[#020406] border border-[#a4f8ff]/30 rounded-l-2xl text-xs font-bold text-[#a4f8ff] select-all cursor-text resize-none break-all leading-relaxed"
                            style={{ WebkitUserSelect: 'all', userSelect: 'all', minWidth: 0 }}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cryptoDetails?.address || '')}
                            className="px-4 bg-[#020406] border border-l-0 border-[#a4f8ff]/30 hover:bg-[#a4f8ff]/10 active:bg-[#a4f8ff]/20 rounded-r-2xl transition-all touch-manipulation flex items-center justify-center flex-shrink-0"
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            title="Copy address"
                          >
                            <Copy className="w-5 h-5 text-[#a4f8ff] hover:text-white transition-colors" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Build crypto deep link for mobile wallet apps
                            const currency = cryptoDetails?.payCurrency?.toLowerCase() || 'bitcoin'
                            const address = cryptoDetails?.address || ''
                            const amount = cryptoDetails?.amount || ''

                            // Map currency to URI scheme
                            const uriSchemes: Record<string, string> = {
                              'btc': 'bitcoin',
                              'bitcoin': 'bitcoin',
                              'ltc': 'litecoin',
                              'litecoin': 'litecoin',
                              'eth': 'ethereum',
                              'ethereum': 'ethereum',
                              'doge': 'dogecoin',
                              'dogecoin': 'dogecoin',
                              'bch': 'bitcoincash',
                            }

                            const scheme = uriSchemes[currency] || currency

                            // Construct URI: bitcoin:address?amount=0.001
                            const walletUri = `${scheme}:${address}?amount=${amount}`

                            // Try to open wallet app, fallback to payLink
                            const link = cryptoDetails?.payLink || walletUri
                            window.location.href = link
                          }}
                          className="h-12 px-6 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-2xl flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] touch-manipulation"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        >
                          Open Wallet
                          <ExternalLink className="w-4 h-4" />
                        </button>
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
                      <div className="flex items-stretch w-fit">
                        <input
                          type="text"
                          readOnly
                          value={cryptoDetails?.amount || '...'}
                          className="h-14 px-5 bg-[#020406] border border-[#a4f8ff]/30 rounded-l-2xl text-sm font-black text-[#a4f8ff] select-all cursor-text min-w-[150px]"
                          style={{ WebkitUserSelect: 'all', userSelect: 'all' }}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const amount = cryptoDetails?.amount
                            if (!amount || amount === '...' || amount === '0') {
                              toast.error("Amount not ready yet")
                              return
                            }
                            copyToClipboard(amount)
                          }}
                          className="h-14 px-4 bg-[#020406] border border-l-0 border-[#a4f8ff]/30 hover:bg-[#a4f8ff]/10 active:bg-[#a4f8ff]/20 rounded-r-2xl transition-all touch-manipulation flex items-center justify-center"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          title="Copy amount"
                        >
                          <Copy className="w-5 h-5 text-[#a4f8ff] hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History Tracking */}
                  <div className="p-6 rounded-2xl bg-background/40 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a4f8ff]">Transaction History</h4>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1 h-1 rounded-full animate-pulse",
                            paymentStatus === 'pending' ? "bg-[#a4f8ff]/40" : "bg-green-500"
                          )} />
                          <span className="text-[8px] font-black text-[#a4f8ff]/40 uppercase tracking-widest leading-none">
                            {paymentStatus === 'pending' ? 'Syncing with Nodes...' : 'Live Monitoring...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {paymentStatus === 'pending' && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 group/waiting">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center">
                            <Loader2 className="w-3 h-3 text-white/20 animate-spin group-hover/waiting:text-[#a4f8ff]/40 transition-colors" />
                          </div>
                          <p className="text-sm font-medium text-white/40">Searching for transactions on the blockchain...</p>
                        </div>
                      )}

                      {(paymentStatus === 'processing' || paymentStatus === 'completed') && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Transaction</p>
                              <p className="text-[10px] font-black uppercase tracking-tighter text-green-500">
                                DETECTED
                              </p>
                              {blockchainStatus?.txId && (
                                <p className="text-[8px] font-mono text-white/30 truncate">
                                  {blockchainStatus.txId.slice(0, 12)}...{blockchainStatus.txId.slice(-8)}
                                </p>
                              )}
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Status</p>
                              <p className="text-[10px] font-black text-[#a4f8ff] tracking-tighter uppercase">
                                {paymentStatus === 'completed'
                                  ? '2/2 Confirmed ✓'
                                  : blockchainStatus
                                    ? <span className="flex items-center gap-2">
                                      {Math.min(blockchainStatus.confirmations || 0, 2)}/2 Confirmations
                                      <Loader2 className="w-2.5 h-2.5 animate-spin opacity-50" />
                                    </span>
                                    : <span className="flex items-center gap-2">
                                      0/2 Confirmations
                                      <Loader2 className="w-2.5 h-2.5 animate-spin opacity-50" />
                                    </span>}
                              </p>
                            </div>
                          </div>

                          {/* Blockchain Explorer Link */}
                          <a
                            href={blockchainStatus?.txId
                              ? getExplorerUrl(blockchainStatus.txId, cryptoDetails?.payCurrency || "", false)
                              : getExplorerUrl(cryptoDetails?.address || "", cryptoDetails?.payCurrency || "", true)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#a4f8ff]/5 border border-[#a4f8ff]/10 text-[9px] font-black text-[#a4f8ff]/70 hover:bg-[#a4f8ff]/10 hover:text-[#a4f8ff] transition-all group"
                          >
                            {blockchainStatus?.txId ? 'VIEW TRANSACTION ON BLOCKCHAIN' : 'VIEW ADDRESS ON BLOCKCHAIN'}
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStep(1)
                      setSavedItems([])
                      if (urlOrderId) {
                        localStorage.removeItem(`checkout_sess_${urlOrderId}`)
                      }
                    }}
                    className="w-full h-10 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-brand-primary transition-all flex items-center justify-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Return to order information
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Footer Link */}
            <div className="mt-auto py-6 border-t border-white/5 flex justify-center items-center bg-gradient-to-t from-[#030607] to-transparent">
              <Link href="/store" className="flex items-center gap-3 text-[10px] font-black text-white/20 hover:text-brand-primary uppercase tracking-[0.3em] transition-all group">
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Keep Shopping
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div >
        </div >
      </div >

      <AnimatePresence>
        {/* Select Payment Method Modal */}
        {isMethodModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMethodModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-lg font-bold">Select Payment Method</h3>
                <button
                  onClick={() => setIsMethodModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cryptoGroups.map((group) => {
                  const getMethodName = (m: any) => (m.name === "Tether" || m.name === "USD coin" || m.name === "Ethereum") ? `${m.name} (${m.network})` : m.name
                  const filteredItems = group.items.filter(m => !disabledMethods.includes(m.name) && !disabledMethods.includes(getMethodName(m)))

                  if (filteredItems.length === 0) return null

                  return (
                    <div key={group.label} className="space-y-3">
                      <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest pl-1">{group.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredItems.map((method) => {
                          const methodName = getMethodName(method)
                          const isSelected = selectedMethod === methodName
                          return (
                            <div
                              key={method.id + method.network}
                              onClick={() => {
                                if (method.name === "Ethereum") {
                                  setIsMethodModalOpen(false)
                                  setIsEthNetworkModalOpen(true)
                                } else {
                                  setSelectedMethod(methodName)
                                  setIsMethodModalOpen(false)
                                }
                              }}
                              className={cn(
                                "relative flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer group transition-all duration-200",
                                isSelected ? "bg-white/[0.05] border border-[#a4f8ff] ring-4 ring-[#a4f8ff]/10" : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                              )}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-bold text-white">{method.name}</span>
                                  {method.id === "ltc" && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                      <span className="text-[8px] font-bold text-yellow-400 uppercase">Popular</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{method.network}</span>
                              </div>

                              <div className="w-8 h-8 flex items-center justify-center p-1.5 bg-white/5 rounded-lg transition-transform duration-300 group-hover:scale-110">
                                <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                              </div>

                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#a4f8ff] absolute -right-1 -top-1 bg-[#0d1117] rounded-full animate-in zoom-in duration-200" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div >
            </motion.div >
          </div >
        )}

        {/* ETH Network Selection Modal */}
        {
          isEthNetworkModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEthNetworkModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-[#090b0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#a4f8ff]/10 rounded-xl">
                      <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035" alt="ETH" className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Select ETH Network</h3>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Choose your preferred network</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEthNetworkModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ETH_NETWORKS.map((method) => {
                    const methodName = `${method.name} (${method.network})`
                    const isSelected = selectedMethod === methodName

                    return (
                      <div
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(methodName)
                          setIsEthNetworkModalOpen(false)
                        }}
                        className={cn(
                          "relative flex items-center justify-between py-3.5 px-4 rounded-xl cursor-pointer group transition-all duration-200",
                          isSelected ? "bg-white/[0.05] border border-[#a4f8ff] ring-4 ring-[#a4f8ff]/10" : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-white">{method.network}</span>
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Ethereum</span>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center p-1.5 bg-white/5 rounded-lg transition-transform duration-300 group-hover:scale-110">
                          <img src={method.icon} alt={method.network} className="w-full h-full object-contain" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#a4f8ff] absolute -right-1 -top-1 bg-[#090b0d] rounded-full animate-in zoom-in duration-200" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
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
