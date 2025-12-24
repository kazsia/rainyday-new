"use client"

import { useState, useEffect, useMemo } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { markNotificationRead, markAllNotificationsRead, getRecentNotifications, type AdminNotification } from "@/lib/actions/create-notification"
import { useRouter } from "next/navigation"
import {
    ShoppingCart,
    CreditCard,
    DollarSign,
    RefreshCw,
    AlertTriangle,
    UserPlus,
    Users,
    Package,
    Webhook,
    Send,
    Check,
    CheckCircle2,
    MessageSquare,
    Star,
    Info,
    Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bgColor: string, label: string }> = {
    new_order: { icon: ShoppingCart, color: "text-emerald-400", bgColor: "bg-emerald-400/10", label: "New Order" },
    payment_confirmed: { icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-400/10", label: "New Sale" },
    high_value_sale: { icon: DollarSign, color: "text-amber-400", bgColor: "bg-amber-400/10", label: "High Value Sale" },
    refund_issued: { icon: RefreshCw, color: "text-orange-400", bgColor: "bg-orange-400/10", label: "Refund Issued" },
    chargeback: { icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-400/10", label: "Chargeback" },
    new_customer: { icon: UserPlus, color: "text-blue-400", bgColor: "bg-blue-400/10", label: "New Customer" },
    repeat_buyer: { icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10", label: "Repeat Buyer" },
    large_quantity: { icon: Package, color: "text-cyan-400", bgColor: "bg-cyan-400/10", label: "Large Quantity" },
    webhook_failure: { icon: Webhook, color: "text-red-400", bgColor: "bg-red-400/10", label: "Webhook Failure" },
    payment_retry: { icon: RefreshCw, color: "text-amber-400", bgColor: "bg-amber-400/10", label: "Payment Retry" },
    delivery_resend: { icon: Send, color: "text-blue-400", bgColor: "bg-blue-400/10", label: "Delivery Resend" },
    new_ticket: { icon: MessageSquare, color: "text-blue-400", bgColor: "bg-blue-400/10", label: "New Support Ticket" },
    feedback_received: { icon: Star, color: "text-amber-400", bgColor: "bg-amber-400/10", label: "Feedback Received" },
}

const defaultConfig = { icon: Info, color: "text-brand", bgColor: "bg-brand/10", label: "Notification" }

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchNotifications() {
            setLoading(true)
            try {
                const data = await getRecentNotifications(100)
                setNotifications(data)
            } catch (error) {
                console.error("[NotificationsPage] Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()

        // Realtime subscription
        const channel = supabase
            .channel('notifications-page')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
                (payload) => {
                    setNotifications(prev => [payload.new as AdminNotification, ...prev])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    async function handleNotificationClick(notification: AdminNotification) {
        if (!notification.read_at) {
            await markNotificationRead(notification.id)
            setNotifications(prev =>
                prev.map(n => n.id === notification.id
                    ? { ...n, read_at: new Date().toISOString() }
                    : n
                )
            )
        }

        if (notification.related_order_id) {
            router.push(`/admin/invoices/${notification.related_order_id}`)
        }
    }

    async function handleMarkAllRead() {
        await markAllNotificationsRead()
        setNotifications(prev =>
            prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
    }

    const unreadCount = notifications.filter(n => !n.read_at).length

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Notifications</h1>
                            <p className="text-sm text-white/40">
                                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-[#080c10] border border-white/5 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-white/20 mb-3" />
                            <p className="text-sm text-white/30">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <Bell className="w-7 h-7 text-white/20" />
                            </div>
                            <p className="text-sm text-white/40 font-medium">No notifications yet</p>
                            <p className="text-xs text-white/20 mt-1">Sales and updates will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map(notification => {
                                const config = typeConfig[notification.type] || defaultConfig
                                const Icon = config.icon
                                const isUnread = !notification.read_at

                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "w-full px-5 py-4 flex gap-4 text-left transition-colors hover:bg-white/[0.02]",
                                            isUnread && "bg-brand/[0.02]"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                            config.bgColor
                                        )}>
                                            <Icon className={cn("w-5 h-5", config.color)} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn(
                                                            "text-sm font-semibold",
                                                            isUnread ? "text-white" : "text-white/60"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        {isUnread && (
                                                            <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm mt-0.5 line-clamp-2",
                                                        isUnread ? "text-white/50" : "text-white/30"
                                                    )}>
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-white/30 whitespace-nowrap flex-shrink-0 pt-0.5">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
