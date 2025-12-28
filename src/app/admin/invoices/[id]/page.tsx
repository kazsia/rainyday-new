"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { adminGetOrder, retriggerDelivery, updateOrderStatus } from "@/lib/db/orders"
import { createBlacklistEntry } from "@/lib/db/blacklist"
import { syncPaymentTxId } from "@/lib/db/payments"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  Link as LinkIcon,
  Copy,
  MoreVertical,
  CreditCard,
  User,
  ShoppingCart,
  StickyNote,
  Download,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Ban,
  Lock as LockIcon,
  Save as SaveIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

function parseUserAgent(ua: string) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' }

  let browser = 'Unknown'
  let os = 'Unknown'

  // Simple parser
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'

  if (ua.includes('Win')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'MacOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return { browser, os }
}

export default function AdminInvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetriggering, setIsRetriggering] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string)
    }
  }, [params.id])

  async function loadOrder(id: string) {
    try {
      let data = await adminGetOrder(id)

      // Auto-sync missing TXIDs
      if (data?.payments) {
        const paymentsToSync = data.payments.filter((p: any) => p.track_id && !p.tx_id)
        if (paymentsToSync.length > 0) {
          const results = await Promise.all(paymentsToSync.map((p: any) => syncPaymentTxId(p.id)))
          if (results.some(r => r.success)) {
            // If we found new info, refresh data
            data = await adminGetOrder(id)
            toast.success("Payment details synced automatically")
          }
        }
      }

      setOrder(data)

      // Standardize URL to readable_id if current param is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid && data?.readable_id) {
        window.history.replaceState(null, '', `/admin/invoices/${data.readable_id}`)
      }
    } catch (error) {
      toast.error("Failed to load invoice details")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  async function handleRetriggerDelivery() {
    if (!order?.id) return
    setIsRetriggering(true)
    try {
      const result = await retriggerDelivery(order.id)
      if (result.success) {
        toast.success(result.message || "Delivery triggered successfully")
        await loadOrder(order.id) // Refresh to show new deliverables
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger delivery")
    } finally {
      setIsRetriggering(false)
    }
  }

  async function handleSyncPayment(paymentId: string) {
    setIsSyncing(paymentId)
    try {
      const result = await syncPaymentTxId(paymentId)
      if (result.success) {
        toast.success("Payment data synced successfully")
        await loadOrder(params.id as string)
      } else {
        toast.error(result.message || "Failed to sync payment data")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sync payment data")
    } finally {
      setIsSyncing(null)
    }
  }

  // Helper for status badges (reused style)
  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      processing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      cancelled: "bg-white/5 text-white/40 border-white/10",
      refunded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      expired: "bg-white/5 text-white/40 border-white/10",
    }[status] || "bg-white/5 text-white/40 border-white/10"

    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border", styles)}>
        {status}
      </span>
    )
  }

  const getPaymentIcon = (provider: string | undefined) => {
    if (!provider) return null
    const p = provider.toLowerCase()
    if (p.includes('btc') || p.includes('bitcoin')) return <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035" className="w-4 h-4" alt="BTC" />
    if (p.includes('eth') || p.includes('ethereum')) return <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035" className="w-4 h-4" alt="ETH" />
    if (p.includes('ltc') || p.includes('litecoin')) return <img src="https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035" className="w-4 h-4" alt="LTC" />
    if (p.includes('usdt')) return <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-4 h-4" alt="USDT" />
    if (p.includes('paypal') || p === 'pp') return <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg" className="w-4 h-4" alt="PayPal" />
    return <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px]">?</div>
  }

  const getExplorerUrl = (txId: string, provider: string) => {
    if (!txId) return "#"
    const p = provider.toLowerCase()
    if (p.includes('btc') || p.includes('bitcoin')) return `https://mempool.space/tx/${txId}`
    if (p.includes('eth') || p.includes('ethereum') || p.includes('erc20')) return `https://etherscan.io/tx/${txId}`
    if (p.includes('ltc') || p.includes('litecoin')) return `https://live.blockcypher.com/ltc/tx/${txId}`
    if (p.includes('doge')) return `https://live.blockcypher.com/doge/tx/${txId}`
    if (p.includes('trx') || p.includes('tron') || p.includes('trc20')) return `https://tronscan.org/#/transaction/${txId}`
    if (p.includes('bnb') || p.includes('bsc') || p.includes('bep20')) return `https://bscscan.com/tx/${txId}`
    if (p.includes('sol') || p.includes('solana')) return `https://solscan.io/tx/${txId}`
    if (p.includes('ton')) return `https://tonviewer.com/transaction/${txId}`
    if (p.includes('pol') || p.includes('polygon') || p.includes('matic')) return `https://polygonscan.com/tx/${txId}`
    if (p.includes('xrp') || p.includes('ripple')) return `https://xrpscan.com/tx/${txId}`
    if (p.includes('xmr') || p.includes('monero')) return `https://xmrchain.net/tx/${txId}`
    if (p.includes('bch') || p.includes('bitcoin cash')) return `https://blockchair.com/bitcoin-cash/transaction/${txId}`

    // Fallback
    if (txId.startsWith('0x')) return `https://etherscan.io/search?q=${txId}`
    return `https://blockchair.com/search?q=${txId}`
  }

  if (isLoading) return <AdminLayout>
    <div className="flex items-center justify-center h-96" suppressHydrationWarning>
      <RefreshCw className="w-6 h-6 animate-spin text-white/20" />
    </div>
  </AdminLayout>

  if (!order) return <AdminLayout>
    <div className="text-center py-20">
      <h2 className="text-xl text-white">Invoice not found</h2>
      <Button variant="link" onClick={() => router.push('/admin/invoices')} className="text-brand">Go back</Button>
    </div>
  </AdminLayout>

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-white/5 bg-[#0b0f1a]/40 text-white/40 hover:text-white" onClick={() => router.push('/admin/invoices')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Invoice Details
              </h1>
              <p className="text-sm font-medium text-white/40">View the details of the invoice.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-11 border-[#1e293b] bg-[#0f172a] text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-xl font-bold text-xs uppercase tracking-widest px-6 transition-colors"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="h-11 border-[#1e293b] bg-[#0f172a] text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-xl font-bold text-xs uppercase tracking-widest px-6 transition-colors"
              onClick={async () => {
                if (!confirm('Are you sure you want to mark this order as refunded?')) return

                toast.promise(updateOrderStatus(order.id, 'refunded'), {
                  loading: 'Marking as refunded...',
                  success: (data) => {
                    loadOrder(order.id)
                    return 'Order marked as refunded'
                  },
                  error: 'Failed to mark as refunded'
                })
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Mark as Refunded
            </Button>
            {/* Manually Process Invoice - Only for unpaid orders */}
            {order.status !== 'paid' && order.status !== 'completed' && order.status !== 'delivered' && (
              <Button
                className="h-11 bg-[#0f172a] hover:bg-[#1e293b] text-white border border-[#1e293b] rounded-xl font-bold text-xs uppercase tracking-widest px-6 transition-colors"
                onClick={async () => {
                  if (!confirm('Are you sure you want to manually process this invoice? This will mark it as paid and trigger delivery.')) return

                  toast.promise(updateOrderStatus(order.id, 'paid'), {
                    loading: 'Processing invoice...',
                    success: (data) => {
                      loadOrder(order.id)
                      return 'Invoice processed successfully! Delivery triggered.'
                    },
                    error: 'Failed to process invoice'
                  })
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Manually Process Invoice
              </Button>
            )}
            <Button className="h-11 bg-[#a4f8ff] hover:bg-[#a4f8ff]/90 text-black border-0 shadow-lg shadow-[#a4f8ff]/20 rounded-xl font-bold text-xs uppercase tracking-widest px-6" onClick={() => window.open(`/invoice?id=${order.readable_id || order.payments?.[0]?.track_id || order.id}`, '_blank')}>
              <LinkIcon className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
            {/* Retrigger Delivery Button - Only for paid orders */}
            {['paid', 'delivered', 'completed'].includes(order.status) && (
              <Button
                variant="outline"
                className="h-11 border-white/5 bg-[#0b0f1a]/40 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold text-xs uppercase tracking-widest px-6"
                onClick={handleRetriggerDelivery}
                disabled={isRetriggering}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRetriggering && "animate-spin")} />
                {isRetriggering ? "Retriggering..." : "Retrigger Delivery"}
              </Button>
            )}
          </div>
        </div>

        {/* Main Info Cards - Side by Side on XL */}
        <div className="flex flex-col xl:flex-row gap-10">

          {/* Order Information */}
          <div className="flex-1 bg-[#0b0f1a]/40 border border-white/5 rounded-[2rem] p-10 space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#a4f8ff]/10 flex items-center justify-center border border-[#a4f8ff]/20 shadow-lg shadow-[#a4f8ff]/10">
                <div className="w-6 h-6 text-[#a4f8ff]">
                  <CreditCard className="w-full h-full" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Order Information</h2>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between group">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-medium text-white/60">{order.payments?.[0]?.track_id || order.readable_id}</code>
                  <button onClick={() => copyToClipboard(order.payments?.[0]?.track_id || order.readable_id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Status</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Payment Method</span>
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-white tracking-tight">{order.payments?.[0]?.provider || "Unknown"}</span>
                  {getPaymentIcon(order.payments?.[0]?.provider)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm text-white font-black">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Volume Discount</span>
                <span className="text-sm text-white/40 font-bold">-$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Total Price</span>
                <span className="text-sm text-white font-black">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Total Paid</span>
                <span className={cn("text-xs font-black px-3 py-1 rounded-lg", (order.status === 'paid' || order.status === 'completed') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-white/5 text-white/20 border border-white/10")}>
                  {(order.status === 'paid' || order.status === 'completed') ? `+${formatCurrency(order.total)}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Created At</span>
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{new Date(order.created_at).toLocaleString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Completed At</span>
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {(order.status === 'completed' || order.status === 'delivered')
                    ? new Date(order.updated_at).toLocaleString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="flex-1 bg-[#0b0f1a]/40 border border-white/5 rounded-[2rem] p-10 space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#a4f8ff]/10 flex items-center justify-center border border-[#a4f8ff]/20 shadow-lg shadow-[#a4f8ff]/10">
                <div className="w-6 h-6 text-[#a4f8ff]">
                  <User className="w-full h-full" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Customer Information</h2>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">E-mail Address</span>
                <span className="text-sm font-bold text-white tracking-tight">{order.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">IP Address</span>
                <span className="text-sm font-bold text-white/60">{order.custom_fields?.ip_address || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Country</span>
                <span className="text-sm font-bold text-white/60">Unknown</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Browser</span>
                <span className="text-sm font-bold text-white/60">{parseUserAgent(order.custom_fields?.user_agent).browser}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Operating System</span>
                <span className="text-sm font-bold text-white/60">{parseUserAgent(order.custom_fields?.user_agent).os}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">User Agent</span>
                <span className="text-[10px] font-medium text-white/20 max-w-[400px] truncate text-right">{order.custom_fields?.user_agent || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">ASN</span>
                <span className="text-sm font-bold text-white tracking-tight">18403</span>
              </div>

              <div className="pt-6 space-y-4">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest block">Actions</span>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 font-bold uppercase tracking-widest text-[10px]"
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to blacklist email: ${order.email}?`)) return

                      toast.promise(createBlacklistEntry({
                        type: 'email',
                        value: order.email,
                        match_type: 'exact',
                        reason: `Manual blacklist from invoice ${order.readable_id}`
                      }), {
                        loading: 'Blacklisting email...',
                        success: 'Email blacklisted successfully',
                        error: 'Failed to blacklist email'
                      })
                    }}
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Blacklist Email
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 font-bold uppercase tracking-widest text-[10px]"
                    onClick={async () => {
                      const ip = order.custom_fields?.ip_address
                      if (!ip || ip === 'Unknown') {
                        toast.error('No IP address available to blacklist')
                        return
                      }

                      if (!confirm(`Are you sure you want to blacklist IP: ${ip}?`)) return

                      toast.promise(createBlacklistEntry({
                        type: 'ip',
                        value: ip,
                        match_type: 'exact',
                        reason: `Manual blacklist from invoice ${order.readable_id}`
                      }), {
                        loading: 'Blacklisting IP...',
                        success: 'IP blacklisted successfully',
                        error: 'Failed to blacklist IP'
                      })
                    }}
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Blacklist IP
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-[2rem] overflow-hidden mt-10">
          <div className="px-10 py-8 border-b border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <ShoppingCart className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Product & Variant</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Quantity</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Total Price</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Custom Fields</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {order.order_items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-10 py-8">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold tracking-tight">{item.product?.name || "Unknown Product"}</span>
                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Default Variant</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-white font-black">{item.quantity}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-sm text-white font-black">{formatCurrency(item.price * item.quantity)}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-white/20 text-sm font-medium">-</span>
                    </td>
                    <td className="px-10 py-8">
                      {order.status === 'completed' || order.status === 'delivered' ? (
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-white/60 hover:text-white font-bold text-[10px] uppercase tracking-widest" onClick={() => window.open(`/invoice?id=${order.readable_id || order.id}`, '_blank')}>
                          <LinkIcon className="w-3 h-3 mr-2" />
                          View
                        </Button>
                      ) : (
                        <span className="text-white/10 text-[10px] font-black uppercase tracking-widest">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-[2rem] overflow-hidden mt-10">
          <div className="px-10 py-8 border-b border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Amount</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">Paid At</th>
                  <th className="px-10 py-6 font-black text-white/40 uppercase tracking-widest text-[10px]">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {order.payments?.map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-10 py-8">
                      {getStatusBadge(pay.status)}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black tracking-tight">{formatCurrency(pay.amount)}</span>
                          <span className="text-white/20 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">{pay.currency}</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                          100.00% of {formatCurrency(pay.amount)} {pay.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        {(pay.status === 'completed' || pay.status === 'paid')
                          ? new Date(pay.updated_at || pay.created_at).toLocaleString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
                          : "-"}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        {pay.tx_id ? (
                          <a
                            href={getExplorerUrl(pay.tx_id, pay.provider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand hover:underline font-medium truncate max-w-[200px]"
                            title={pay.tx_id}
                          >
                            {pay.tx_id}
                          </a>
                        ) : (
                          <code className="text-xs text-white/60 font-medium truncate max-w-[200px]" title={pay.track_id || "-"}>
                            {pay.track_id || "-"}
                          </code>
                        )}
                        {pay.tx_id && (
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Blockchain TXID</span>
                        )}
                        {!pay.tx_id && pay.track_id && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Track ID</span>
                            <button
                              onClick={() => handleSyncPayment(pay.id)}
                              disabled={isSyncing === pay.id}
                              className="w-fit text-[8px] font-black text-brand hover:text-brand/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5", isSyncing === pay.id && "animate-spin")} />
                              Sync TXID
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!order.payments || order.payments.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-10 py-16 text-center text-white/10 text-xs font-black uppercase tracking-[0.2em]">
                      No payment history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Note */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-[2rem] overflow-hidden mb-10">
          <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#a4f8ff]/10 flex items-center justify-center border border-[#a4f8ff]/20">
              <StickyNote className="w-5 h-5 text-[#a4f8ff]" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Invoice Note</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#a4f8ff] uppercase tracking-widest">Administrator Note</p>
              <p className="text-xs font-medium text-white/20 leading-relaxed">This note will be visible to shop administrators only. You can use this to keep track of important information about the invoice.</p>
            </div>
            <Textarea
              placeholder="Add a note... (e.g., Refund processed manually)"
              className="bg-white/[0.02] border-white/5 min-h-[120px] text-white focus:border-[#a4f8ff]/50 rounded-2xl p-4 text-sm font-medium transition-all"
            />
            <div className="pt-2">
              <Button className="w-full h-11 bg-[#a4f8ff] hover:bg-[#a4f8ff]/90 text-black border-0 shadow-lg shadow-[#a4f8ff]/20 rounded-xl font-bold text-xs uppercase tracking-widest gap-2">
                <SaveIcon className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="flex justify-between items-center py-10 border-t border-white/5 mt-10">
          <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] " suppressHydrationWarning>
            <img src="/logo.png" alt="" className="w-5 h-5 opacity-20 grayscale" />
            Rainyday Fulfillment
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-widest " suppressHydrationWarning>
            <span>Secured by Rainyday Shield</span>
            <LockIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
