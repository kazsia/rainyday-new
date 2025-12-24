"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { markNotificationRead, markAllNotificationsRead, getRecentNotifications, type AdminNotification } from "@/lib/actions/create-notification"
import { useRouter } from "next/navigation"
import {
    ShoppingCart,
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
    Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"

interface NotificationPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onNotificationsRead: () => void
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bgColor: string }> = {
    new_order: { icon: ShoppingCart, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
    payment_confirmed: { icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
    high_value_sale: { icon: DollarSign, color: "text-amber-400", bgColor: "bg-amber-400/10" },
    refund_issued: { icon: RefreshCw, color: "text-orange-400", bgColor: "bg-orange-400/10" },
    chargeback: { icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-400/10" },
    new_customer: { icon: UserPlus, color: "text-blue-400", bgColor: "bg-blue-400/10" },
    repeat_buyer: { icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10" },
    large_quantity: { icon: Package, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
    webhook_failure: { icon: Webhook, color: "text-red-400", bgColor: "bg-red-400/10" },
    payment_retry: { icon: RefreshCw, color: "text-amber-400", bgColor: "bg-amber-400/10" },
    delivery_resend: { icon: Send, color: "text-blue-400", bgColor: "bg-blue-400/10" },
    new_ticket: { icon: MessageSquare, color: "text-blue-400", bgColor: "bg-blue-400/10" },
    feedback_received: { icon: Star, color: "text-amber-400", bgColor: "bg-amber-400/10" },
}

const defaultConfig = { icon: Info, color: "text-brand", bgColor: "bg-brand/10" }

export function NotificationPanel({ open, onOpenChange, onNotificationsRead }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const panelRef = useRef<HTMLDivElement>(null)

    const supabase = useMemo(() => createClient(), [])

    // Close on click outside
    useEffect(() => {
        if (!open) return

        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                // Check if click is on the bell button (parent controls this)
                const target = event.target as HTMLElement
                if (!target.closest('[data-notification-bell]')) {
                    onOpenChange(false)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, onOpenChange])

    // Fetch notifications when panel opens
    useEffect(() => {
        if (!open) return

        async function fetchNotifications() {
            setLoading(true)
            try {
                const data = await getRecentNotifications(20)
                setNotifications(data)
            } catch (error) {
                console.error("[NotificationPanel] Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [open, supabase])

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
                    onNotificationsRead()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, supabase, onNotificationsRead])

    async function handleNotificationClick(notification: AdminNotification) {
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
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Dropdown Panel */}
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 w-[400px] rounded-2xl shadow-2xl z-[100] overflow-hidden border border-white/10"
                        style={{
                            background: "linear-gradient(180deg, rgba(20, 25, 35, 0.98) 0%, rgba(10, 15, 20, 0.98) 100%)",
                            backdropFilter: "blur(20px)"
                        }}
                    >
                        {/* Header with gradient */}
                        <div
                            className="px-5 py-4 flex items-center justify-between"
                            style={{
                                background: "linear-gradient(90deg, rgba(38, 188, 196, 0.08) 0%, rgba(38, 188, 196, 0.02) 100%)",
                                borderBottom: "1px solid rgba(255,255,255,0.05)"
                            }}
                        >
                            <div>
                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                <p className="text-[10px] text-white/40 mt-0.5">{notifications.filter(n => !n.read_at).length} unread</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllRead}
                                className="h-8 px-3 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg"
                            >
                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                Mark all read
                            </Button>
                        </div>

                        {/* Content */}
                        <ScrollArea className="h-[420px]">
                            {loading ? (
                                <div className="p-10 text-center">
                                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-brand/40 mb-3" />
                                    <p className="text-xs text-white/30">Loading notifications...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center border border-brand/10">
                                        <ShoppingCart className="w-7 h-7 text-brand/40" />
                                    </div>
                                    <p className="text-sm text-white/50 font-medium">No notifications yet</p>
                                    <p className="text-xs text-white/25 mt-1">Sales and updates will appear here</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.slice(0, 10).map(notification => {
                                        const config = typeConfig[notification.type] || defaultConfig
                                        const Icon = config.icon
                                        const isUnread = !notification.read_at

                                        return (
                                            <button
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={cn(
                                                    "w-full px-4 py-3.5 flex gap-3.5 text-left rounded-xl transition-all duration-200",
                                                    isUnread
                                                        ? "bg-gradient-to-r from-white/[0.06] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04] border border-white/[0.05]"
                                                        : "hover:bg-white/[0.03]"
                                                )}
                                            >
                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                                    config.bgColor,
                                                    isUnread ? "border-white/10" : "border-transparent"
                                                )}>
                                                    <Icon className={cn("w-5 h-5", config.color)} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn(
                                                            "text-sm font-semibold truncate",
                                                            isUnread ? "text-white" : "text-white/50"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        <span className={cn(
                                                            "text-[10px] whitespace-nowrap flex-shrink-0 px-1.5 py-0.5 rounded",
                                                            isUnread ? "text-brand bg-brand/10" : "text-white/25"
                                                        )}>
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: false })}
                                                        </span>
                                                    </div>
                                                    <p className={cn(
                                                        "text-xs mt-1 line-clamp-2",
                                                        isUnread ? "text-white/60" : "text-white/30"
                                                    )}>
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Unread indicator */}
                                                {isUnread && (
                                                    <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1.5 animate-pulse" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div
                                className="px-5 py-3 text-center"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <button
                                    onClick={() => {
                                        onOpenChange(false)
                                        router.push('/admin/notifications')
                                    }}
                                    className="text-xs text-brand hover:text-brand/80 font-semibold transition-colors inline-flex items-center gap-1"
                                >
                                    View all notifications
                                    <span className="text-brand/50">→</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
