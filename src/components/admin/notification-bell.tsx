"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { NotificationPanel } from "./notification-panel"
import { cn } from "@/lib/utils"

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    // Fetch initial unread count
    const fetchUnreadCount = useCallback(async () => {
        const { count, error } = await supabase
            .from('admin_notifications')
            .select('*', { count: 'exact', head: true })
            .is('read_at', null)

        if (!error && count !== null) {
            setUnreadCount(count)
        }
    }, [supabase])

    useEffect(() => {
        fetchUnreadCount()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_notifications'
                },
                () => {
                    // New notification - increment count
                    setUnreadCount(prev => prev + 1)

                    // Play notification sound
                    const audio = new Audio('/sounds/notification.mp3')
                    audio.volume = 0.5
                    audio.play().catch(() => { })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'admin_notifications'
                },
                (payload) => {
                    // Check if notification was marked as read
                    const wasUnread = !payload.old?.read_at
                    const isNowRead = !!payload.new?.read_at

                    if (wasUnread && isNowRead) {
                        setUnreadCount(prev => Math.max(0, prev - 1))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchUnreadCount])

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "relative text-[var(--sa-fg-dim)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)] rounded-lg h-9 w-9 border border-transparent hover:border-[var(--sa-border)] transition-all",
                    unreadCount > 0 && "text-[var(--sa-accent)]"
                )}
            >
                <Bell className="w-4 h-4" />

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-in zoom-in-50 duration-75">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            <NotificationPanel
                open={isOpen}
                onOpenChange={setIsOpen}
                onNotificationsRead={fetchUnreadCount}
            />
        </>
    )
}
