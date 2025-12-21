"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { markNotificationRead, markAllNotificationsRead, type AdminNotification } from "@/lib/actions/create-notification"
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
    CheckCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

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
    critical: "text-emerald-400 bg-emerald-400/10"
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
    const supabase = createClient()

    // Fetch notifications when panel opens
    useEffect(() => {
        if (!open) return

        async function fetchNotifications() {
            setLoading(true)
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (!error && data) {
                setNotifications(data as AdminNotification[])
            }
            setLoading(false)
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
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, supabase])

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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[420px] p-0 bg-[var(--sa-bg)] border-l border-[var(--sa-border)]"
            >
                <SheetHeader className="p-4 border-b border-[var(--sa-border)] flex flex-row items-center justify-between">
                    <SheetTitle className="text-[var(--sa-fg-bright)] text-lg font-bold">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </SheetTitle>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="text-xs text-[var(--sa-fg-muted)] hover:text-[var(--sa-fg-bright)]"
                        >
                            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                            Mark all read
                        </Button>
                    )}
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-80px)]">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--sa-fg-muted)]">
                            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-[var(--sa-fg-muted)]">
                            <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                            <p className="text-xs mt-1 opacity-60">Sales and events will appear here</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {groupedNotifications.map(group => (
                                <div key={group.label} className="mb-4">
                                    <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--sa-fg-dim)]">
                                        {group.label}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.notifications.map(notification => {
                                            const Icon = typeIcons[notification.type] || ShoppingCart
                                            const isUnread = !notification.read_at

                                            return (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        "w-full p-3 rounded-lg text-left transition-all",
                                                        "hover:bg-[var(--sa-card-hover)]",
                                                        isUnread && "bg-[var(--sa-card)]"
                                                    )}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                                            severityColors[notification.severity]
                                                        )}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={cn(
                                                                    "text-sm font-medium truncate",
                                                                    isUnread
                                                                        ? "text-[var(--sa-fg-bright)]"
                                                                        : "text-[var(--sa-fg-muted)]"
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                {isUnread && (
                                                                    <span className="w-2 h-2 rounded-full bg-[var(--sa-accent)] flex-shrink-0 mt-1.5" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-[var(--sa-fg-dim)] mt-0.5 truncate">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-[10px] text-[var(--sa-fg-dim)] mt-1 opacity-60">
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
