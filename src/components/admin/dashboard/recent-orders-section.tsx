"use client"

import { CreditCard, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

import { getCryptoIdentifier } from "@/lib/utils/payment"

const getPaymentLogo = (payment: any) => {
    const p = getCryptoIdentifier(payment)
    if (!p) return <CreditCard className="w-3.5 h-3.5 text-[var(--sa-fg-muted)]" />

    // Coupon / Manual
    if (p === 'coupon') return <CreditCard className="w-3.5 h-3.5 text-purple-400" />
    if (p === 'manual' || p === 'admin') return <CreditCard className="w-3.5 h-3.5 text-indigo-400" />

    const logoMap: Record<string, string> = {
        "btc": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
        "bitcoin": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
        "eth": "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
        "ethereum": "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
        "ltc": "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035",
        "litecoin": "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035",
        "usdt": "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035",
        "usdc": "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035",
        "sol": "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
        "solana": "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
        "doge": "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035",
        "dogecoin": "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035",
        "trx": "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035",
        "tron": "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035",
        "xrp": "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035",
        "ripple": "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035",
        "bnb": "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035",
        "xmr": "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035",
        "monero": "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035",
        "ton": "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035",
    }

    const logoUrl = logoMap[p.toLowerCase()] || Object.entries(logoMap).find(([k]) => p.toLowerCase().includes(k))?.[1]

    if (logoUrl) {
        return <div className="w-3.5 h-3.5 relative flex-shrink-0"><Image src={logoUrl} alt={p} fill className="object-contain" unoptimized /></div>
    }

    if (p.includes('paypal') || p === 'pp') {
        return <div className="w-3.5 h-3.5 flex items-center justify-center bg-[#003087] rounded-[2px] text-[8px] font-black text-white leading-none">PP</div>
    }

    if (p === 'crypto') {
        return <div className="w-3.5 h-3.5 flex items-center justify-center bg-cyan-500/20 rounded-full text-[8px] font-black text-cyan-400 leading-none">₿</div>
    }

    return <CreditCard className="w-3.5 h-3.5 text-[var(--sa-accent)]" />
}

interface Order {
    id: string
    readable_id?: string
    product: string
    price: string
    paid: string
    method: string
    provider: string
    email: string
    time: string
    status: string
    payment_info?: any
}

interface RecentOrdersSectionProps {
    recentOrders: Order[]
}

export function RecentOrdersSection({ recentOrders }: RecentOrdersSectionProps) {
    const navigateToInvoice = (url: string) => {
        window.location.href = url
    }

    return (
        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[var(--sa-border)] flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Recent Orders</h3>
                    <div className="px-1.5 py-0.5 rounded-full bg-[var(--sa-accent-muted)] border border-[var(--sa-accent-glow)] text-[9px] font-bold text-[var(--sa-accent)] uppercase">Live</div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-[var(--sa-fg-muted)] hover:text-white uppercase font-bold tracking-wider" asChild>
                    <Link href="/admin/invoices">View All</Link>
                </Button>
            </div>

            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar relative">
                <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[var(--sa-border)] text-[var(--sa-fg-dim)] text-[9px] uppercase font-bold tracking-widest bg-black/20">
                            <th className="px-5 py-3">Product</th>
                            <th className="px-5 py-3">Price</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Method</th>
                            <th className="px-5 py-3">Customer</th>
                            <th className="px-5 py-3 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sa-border)]">
                        {recentOrders.map((order) => {
                            const isPaid = order.paid.startsWith('+')
                            const displayEmail = order.email || "Guest"
                            const customerInitial = displayEmail.charAt(0).toUpperCase()
                            const invoiceUrl = `/admin/invoices/${order.readable_id || order.id}`

                            return (
                                <tr
                                    key={order.id}
                                    className="group hover:bg-white/[0.04] transition-all duration-200 cursor-pointer relative"
                                    onClick={() => navigateToInvoice(invoiceUrl)}
                                >
                                    <td className="px-5 py-3.5 min-w-[200px]">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-white group-hover:text-[var(--sa-accent)] transition-colors">{order.product}</span>
                                            <span className="text-[10px] text-[var(--sa-fg-dim)] font-mono mt-0.5">ID: {order.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-[12px] font-bold text-white/90">{order.price}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider",
                                            isPaid
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                                        )}>
                                            {isPaid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                            {order.paid}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2 text-[var(--sa-fg-dim)] bg-white/[0.03] border border-white/[0.05] rounded-md px-2 py-1 w-fit group-hover:bg-white/[0.05] transition-colors">
                                            {getPaymentLogo(order.payment_info)}
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{order.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 max-w-[220px]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 flex items-center justify-center text-[10px] font-bold text-[var(--sa-fg-muted)]">
                                                {customerInitial}
                                            </div>
                                            <span className="text-[11px] text-[var(--sa-fg-muted)] truncate group-hover:text-white transition-colors">{displayEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-3 text-[var(--sa-fg-dim)] text-[10px] font-bold uppercase tracking-tighter">
                                            <span className="bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.03]">
                                                {order.time}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--sa-accent)]" />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[var(--sa-border)]">
                {recentOrders.map((order) => {
                    const isPaid = order.paid.startsWith('+')
                    const invoiceUrl = `/admin/invoices/${order.readable_id || order.id}`

                    return (
                        <div
                            key={order.id}
                            className="p-4 space-y-4 hover:bg-white/[0.02] transition-colors relative group cursor-pointer"
                            onClick={() => navigateToInvoice(invoiceUrl)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <h4 className="text-[13px] font-bold text-white group-hover:text-[var(--sa-accent)] transition-colors leading-none">{order.product}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--sa-fg-dim)] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">#{order.id.slice(0, 8)}</span>
                                        <span className="text-[10px] text-[var(--sa-fg-dim)] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{order.time}</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider",
                                    isPaid
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                )}>
                                    {isPaid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                    {order.paid}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-1">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-[var(--sa-fg-dim)] uppercase font-bold tracking-widest block">Customer</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[8px] font-bold text-[var(--sa-fg-muted)]">
                                            {(order.email || "G").charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[11px] text-[var(--sa-fg-muted)] truncate max-w-[100px]">{order.email || "Guest"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[9px] text-[var(--sa-fg-dim)] uppercase font-bold tracking-widest block">Total</span>
                                    <span className="text-[13px] font-black text-white">{order.price}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-white/[0.03]">
                                <div className="flex items-center gap-1.5 text-[var(--sa-fg-dim)] bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded">
                                    {getPaymentLogo(order.payment_info)}
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{order.method}</span>
                                </div>
                                <Button variant="ghost" className="h-6 px-2 text-[9px] text-[var(--sa-accent)] font-bold uppercase tracking-wider hover:bg-[var(--sa-accent)]/10" asChild>
                                    <Link href={invoiceUrl}>Details</Link>
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
