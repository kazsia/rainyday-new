"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfToday, startOfYesterday } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"

export type DateRange = {
    from: Date
    to: Date
    label?: string
}

const presets: { label: string; getValue: () => DateRange }[] = [
    {
        label: "Today",
        getValue: () => ({
            from: startOfToday(),
            to: new Date(),
        }),
    },
    {
        label: "Yesterday",
        getValue: () => ({
            from: startOfYesterday(),
            to: startOfToday(),
        }),
    },
    {
        label: "This Week",
        getValue: () => ({
            from: startOfWeek(new Date(), { weekStartsOn: 1 }),
            to: new Date(),
        }),
    },
    {
        label: "Last Week",
        getValue: () => ({
            from: startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
            to: endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
        }),
    },
    {
        label: "This Month",
        getValue: () => ({
            from: startOfMonth(new Date()),
            to: new Date(),
        }),
    },
    {
        label: "Last Month",
        getValue: () => ({
            from: startOfMonth(subMonths(new Date(), 1)),
            to: endOfMonth(subMonths(new Date(), 1)),
        }),
    },
    {
        label: "All Time",
        getValue: () => ({
            from: new Date(2020, 0, 1), // App launch date
            to: new Date(),
        }),
    },
]

export function DateRangePicker() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = React.useState(false)

    // Current selection from URL or default to Today
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const labelParam = searchParams.get("label") || "Today"

    const selectedRange = React.useMemo(() => {
        if (fromParam && toParam) {
            return {
                from: new Date(fromParam),
                to: new Date(toParam),
                label: labelParam
            }
        }
        return presets[0].getValue()
    }, [fromParam, toParam, labelParam])

    const handleSelect = (preset: typeof presets[0]) => {
        const range = preset.getValue()
        const params = new URLSearchParams(searchParams)
        params.set("from", range.from.toISOString())
        params.set("to", range.to.toISOString())
        params.set("label", preset.label)
        router.push(`?${params.toString()}`, { scroll: false })
        setOpen(false)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-9 px-4 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg)] hover:text-white hover:border-[var(--sa-border-hover)] rounded-lg transition-all text-xs font-medium flex items-center gap-2",
                        open && "border-[var(--sa-accent)] ring-1 ring-[var(--sa-accent)]/20 shadow-[0_0_15px_-4px_rgba(var(--sa-accent-rgb),0.3)]"
                    )}
                >
                    <CalendarIcon className="w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                    <span>{labelParam}</span>
                    <ChevronDown className={cn("w-3 h-3 text-[var(--sa-fg-dim)] transition-transform", open && "rotate-180")} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-56 p-2 bg-[var(--sa-card)] border-[var(--sa-border)] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            >
                <div className="flex flex-col gap-1">
                    <p className="px-2 py-1.5 text-[10px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">Select Period</p>
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => handleSelect(preset)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all group",
                                labelParam === preset.label
                                    ? "bg-[var(--sa-accent)]/10 text-[var(--sa-accent)]"
                                    : "text-[var(--sa-fg)] hover:bg-white/[0.04] hover:text-white"
                            )}
                        >
                            <span>{preset.label}</span>
                            {labelParam === preset.label && <Check className="w-3.5 h-3.5" />}
                        </button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
