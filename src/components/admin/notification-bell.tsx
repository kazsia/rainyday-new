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
                    setUnreadCount(prev => prev + 1)
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
        <div className="relative">
            <Button
                data-notification-bell
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative text-white/40 hover:text-white hover:bg-white/5 rounded-lg h-9 w-9 transition-all",
                    unreadCount > 0 && "text-brand",
                    isOpen && "bg-white/5 text-white"
                )}
            >
                <Bell className="w-4 h-4" />

                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            <NotificationPanel
                open={isOpen}
                onOpenChange={setIsOpen}
                onNotificationsRead={fetchUnreadCount}
            />
        </div>
    )
}
