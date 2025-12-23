"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface NotificationPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onNotificationsRead: () => void
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    new_order: ShoppingCart,
    payment_confirmed: CreditCard,
    high_value_sale: DollarSign,
    refund_issued: RefreshCw,
    chargeback: AlertTriangle,
    new_customer: UserPlus,
    repeat_buyer: Users,
    large_quantity: Package,
    webhook_failure: Webhook,
    payment_retry: RefreshCw,
    delivery_resend: Send,
}

const severityColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-400/10",
    warning: "text-amber-400 bg-amber-400/10",
    critical: "text-red-400 bg-red-400/10"
}

function groupNotificationsByDate(notifications: AdminNotification[]) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: { label: string; notifications: AdminNotification[] }[] = [
        { label: 'Today', notifications: [] },
        { label: 'Yesterday', notifications: [] },
        { label: 'Earlier', notifications: [] }
    ]

    notifications.forEach(n => {
        const date = new Date(n.created_at)
        if (date.toDateString() === today.toDateString()) {
            groups[0].notifications.push(n)
        } else if (date.toDateString() === yesterday.toDateString()) {
            groups[1].notifications.push(n)
        } else {
            groups[2].notifications.push(n)
        }
    })

    return groups.filter(g => g.notifications.length > 0)
}

export function NotificationPanel({ open, onOpenChange, onNotificationsRead }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Memoize supabase client to ensure stable reference
    const supabase = useMemo(() => createClient(), [])

    // Fetch notifications when panel opens
    useEffect(() => {
        if (!open) return

        async function fetchNotifications() {
            setLoading(true)
            try {
                const data = await getRecentNotifications(50)
                setNotifications(data)
            } catch (error) {
                console.error("[NotificationPanel] Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [open, supabase, onNotificationsRead]) // Added onNotificationsRead for stability

    // Subscribe to realtime updates when panel is open
    useEffect(() => {
        if (!open) return

        const channel = supabase
            .channel('notification-panel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_notifications'
                },
                (payload) => {
                    setNotifications(prev => [payload.new as AdminNotification, ...prev])
                    // Also trigger the parent count update
                    onNotificationsRead()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, supabase, onNotificationsRead])

    const groupedNotifications = useMemo(
        () => groupNotificationsByDate(notifications),
        [notifications]
    )

    const unreadCount = notifications.filter(n => !n.read_at).length

    async function handleNotificationClick(notification: AdminNotification) {
        // Mark as read
        if (!notification.read_at) {
            await markNotificationRead(notification.id)
            setNotifications(prev =>
                prev.map(n => n.id === notification.id
                    ? { ...n, read_at: new Date().toISOString() }
                    : n
                )
            )
            onNotificationsRead()
        }

        // Navigate to related page
        if (notification.related_order_id) {
            onOpenChange(false)
            router.push(`/admin/invoices/${notification.related_order_id}`)
        }
    }

    async function handleMarkAllRead() {
        await markAllNotificationsRead()
        setNotifications(prev =>
            prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
        onNotificationsRead()
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#020509] border-l border-white/10 z-[100] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#04080F]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-white text-2xl font-black tracking-tight uppercase italic leading-none">
                                Notifications
                            </h2>
                            {unreadCount > 0 && (
                                <span className="px-2 py-1 text-[10px] font-black bg-red-500 text-white rounded-md border border-red-400/20 uppercase tracking-widest leading-none">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllRead}
                                className="h-8 px-3 text-white/40 hover:text-white hover:bg-white/5 gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Mark all read
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1 bg-[#020509]">
                        {loading ? (
                            <div className="p-12 text-center text-white/20">
                                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Initialising stream...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-white/10 mt-12">
                                <ShoppingCart className="w-16 h-16 mx-auto mb-6 opacity-5" />
                                <p className="text-sm font-black uppercase tracking-widest">No active alerts</p>
                                <p className="text-[10px] mt-2 opacity-30 italic font-medium">Realtime sales will appear here</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-8">
                                {groupedNotifications.map(group => (
                                    <div key={group.label}>
                                        <div className="mb-5 px-2">
                                            <span className="px-3 py-1 rounded-sm bg-[#0a1b2e] text-[10px] font-black uppercase tracking-[0.25em] text-[#7afcff] border border-[#7afcff]/20">
                                                {group.label}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {group.notifications.map(notification => {
                                                const Icon = typeIcons[notification.type] || ShoppingCart
                                                const isUnread = !notification.read_at

                                                return (
                                                    <motion.button
                                                        key={notification.id}
                                                        whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)" }}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={cn(
                                                            "w-full p-4 rounded-xl text-left transition-all group relative border border-transparent flex gap-4",
                                                            isUnread ? "bg-white/[0.02]" : "opacity-50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                                            isUnread
                                                                ? "bg-[#0b1526] border border-[#7afcff]/30 text-[#7afcff] shadow-[0_0_15px_rgba(122,252,255,0.15)]"
                                                                : "bg-white/5 text-white/20 border border-transparent"
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={cn(
                                                                    "text-sm font-black truncate tracking-tight transition-colors italic",
                                                                    isUnread ? "text-white" : "text-white/40"
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                {isUnread && (
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5 animate-pulse shadow-[0_0_10px_#ef4444]" />
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2 leading-relaxed font-semibold">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-[9px] text-white/20 mt-3 font-black uppercase tracking-[0.1em]">
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-[#04080F]/90 backdrop-blur-xl">
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.35em] text-center">
                            Neural Activity Stream v2.5.4
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
