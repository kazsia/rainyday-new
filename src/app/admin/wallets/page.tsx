"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Search,
    RefreshCw,
    Plus,
    Bitcoin,
    CreditCard,
    MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function AdminWalletsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [transactions, setTransactions] = useState<any[]>([])
    const [balances, setBalances] = useState<any[]>([
        { sym: "BTC", name: "Bitcoin", val: "0.245", usd: "14,582.50", color: "#f7931a" },
        { sym: "ETH", name: "Ethereum", val: "4.12", usd: "10,250.00", color: "#627eea" },
        { sym: "LTC", name: "Litecoin", val: "85.4", usd: "6,405.00", color: "#345d9d" },
        { sym: "XMR", name: "Monero", val: "12.5", usd: "2,050.00", color: "#ff6600" },
    ])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const supabase = createClient()

            // Fetch recent payments as transactions
            const { data: payments, error } = await supabase
                .from("payments")
                .select("*, orders(readable_id)")
                .order("created_at", { ascending: false })
                .limit(50)

            if (error) throw error
            setTransactions(payments || [])
        } catch (error) {
            toast.error("Failed to load transactions")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.track_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.provider_payment_id?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesTab =
            activeTab === "all" ||
            (activeTab === "received" && tx.amount > 0) ||
            (activeTab === "sent" && tx.amount < 0)

        return matchesSearch && matchesTab
    })

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Wallets</h1>
                        <p className="text-sm text-white/40">Manage your store's treasury and funds</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Address
                        </Button>
                        <Button className="bg-brand text-black font-bold hover:bg-brand/90">
                            Withdraw Funds
                        </Button>
                    </div>
                </div>

                {/* Balances Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {balances.map((coin) => (
                        <div key={coin.sym} className="relative p-6 bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Bitcoin className="w-16 h-16" />
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${coin.color}20`, color: coin.color }}>
                                        {coin.sym}
                                    </div>
                                    <RefreshCw className="w-4 h-4 text-white/20 hover:text-white transition-colors cursor-pointer" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{coin.val} {coin.sym}</p>
                                    <p className="text-sm text-white/40 font-bold">${coin.usd} USD</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transactions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                            {["all", "received", "sent"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all",
                                        activeTab === tab ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input
                                    placeholder="Search hash, address..."
                                    className="pl-10 bg-background/20 border-white/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {isLoading ? (
                                <div className="p-12 text-center text-white/20">Loading activity...</div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="p-12 text-center text-white/20">No activity found.</div>
                            ) : filteredTransactions.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            tx.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                                        )}>
                                            {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {tx.provider} {tx.amount > 0 ? "Deposit" : "Withdrawal"}
                                            </p>
                                            <p className="text-xs text-white/40 font-medium font-mono">{tx.track_id || tx.id.slice(0, 12)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-black",
                                            tx.amount > 0 ? "text-green-500" : "text-white"
                                        )}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount} {tx.currency}
                                        </p>
                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                            {formatDistanceToNow(new Date(tx.created_at))} ago
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
