"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, Wallet, Loader2, ArrowUpRight, History, RefreshCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getCryptoPrices } from "@/lib/crypto"
import { PayoutDialog } from "@/components/admin/crypto/payout-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminCryptoPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [balances, setBalances] = useState({ btc: 0, ltc: 0 })
    const [prices, setPrices] = useState({ btc: 0, ltc: 0 })
    const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState("BTC")

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true)
        else setIsRefreshing(true)

        const supabase = createClient()

        try {
            // 1. Fetch live prices
            const livePrices = await getCryptoPrices()
            setPrices({ btc: livePrices.btc, ltc: livePrices.ltc })

            // 2. Fetch payments to calculate balances
            const { data: payments } = await supabase
                .from('payments')
                .select('amount, currency, status, provider')
                .eq('status', 'completed')

            // 3. Fetch payouts to deduct from balances
            const { data: payoutRecords } = await supabase
                .from('crypto_payouts')
                .select('*')
                .order('created_at', { ascending: false })

            if (payments) {
                const btcIn = payments
                    .filter(p => p.currency === 'BTC' || p.provider === 'Bitcoin')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0)

                const ltcIn = payments
                    .filter(p => p.currency === 'LTC' || p.provider === 'Litecoin')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0)

                const btcOut = (payoutRecords || [])
                    .filter(p => p.currency === 'BTC')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0)

                const ltcOut = (payoutRecords || [])
                    .filter(p => p.currency === 'LTC')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0)

                setBalances({
                    btc: Math.max(0, btcIn - btcOut),
                    ltc: Math.max(0, ltcIn - ltcOut)
                })
            }

            if (payoutRecords) {
                setPayouts(payoutRecords)
            }
        } catch (error) {
            console.error("Fetch error:", error)
            toast.error("Failed to sync crypto data")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handlePayout = (currency: string) => {
        setSelectedCurrency(currency)
        setIsPayoutDialogOpen(true)
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight font-heading">Financial Control</h1>
                        <p className="text-sm text-white/40 mt-1">
                            Real-time liquidity management and payout orchestration.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                        <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>

                {/* Wallet Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bitcoin Wallet */}
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <Bitcoin className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
                                <Bitcoin className="w-6 h-6 text-brand" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Live Node Active</Badge>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Available Bitcoin</p>
                                <div className="text-5xl font-mono font-medium text-white flex items-baseline gap-3">
                                    {balances.btc.toFixed(8)} <span className="text-2xl text-white/20">BTC</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
                                <span className="text-xs font-bold text-white/60">${(balances.btc * (prices.btc || 90000)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-white/20 font-mono">@ ${prices.btc?.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => handlePayout("BTC")}
                            disabled={balances.btc <= 0}
                            className="w-full bg-brand text-black hover:bg-brand/90 h-14 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_4px_20px_-4px_rgba(var(--brand-rgb),0.3)] transition-all active:scale-[0.98]"
                        >
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Request Payout
                        </Button>
                    </div>

                    {/* Litecoin Wallet */}
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <Wallet className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                <Wallet className="w-6 h-6 text-blue-500" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Live Node Active</Badge>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Available Litecoin</p>
                                <div className="text-5xl font-mono font-medium text-white flex items-baseline gap-3">
                                    {balances.ltc.toFixed(8)} <span className="text-2xl text-white/20">LTC</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
                                <span className="text-xs font-bold text-white/60">${(balances.ltc * (prices.ltc || 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-white/20 font-mono">@ ${prices.ltc?.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => handlePayout("LTC")}
                            disabled={balances.ltc <= 0}
                            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98]"
                        >
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Request Payout
                        </Button>
                    </div>
                </div>

                {/* Payout History */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <History className="w-4 h-4 text-white/40" />
                        </div>
                        <h2 className="text-lg font-bold text-white font-heading">Payout Ledger</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Transaction ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Destination</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Asset</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Quantity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <Loader2 className="w-8 h-8 animate-spin" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Ledger...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : payouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <History className="w-8 h-8" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No payout history found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        payouts.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className="text-[11px] font-bold text-white/60 font-mono group-hover:text-brand transition-colors">{item.id.slice(0, 12)}...</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-mono text-white/40 truncate max-w-[150px]">{item.destination_address}</span>
                                                        {item.notes && <span className="text-[10px] italic text-white/20">"{item.notes}"</span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge className={cn(
                                                        "bg-white/5 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                        item.currency === 'BTC' ? 'text-brand' : 'text-blue-500'
                                                    )}>
                                                        {item.currency}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-xs font-bold text-white font-mono">{item.amount.toFixed(8)}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[10px] font-bold text-white/20 font-mono uppercase tracking-tighter">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <PayoutDialog
                isOpen={isPayoutDialogOpen}
                onClose={() => setIsPayoutDialogOpen(false)}
                currency={selectedCurrency}
                balance={selectedCurrency === 'BTC' ? balances.btc : balances.ltc}
                onSuccess={fetchData}
            />
        </AdminLayout>
    )
}
