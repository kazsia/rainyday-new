"use client"

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import { cn } from "@/lib/utils"

interface ChartData {
    name: string
    revenue: number
    orders: number
}

interface RevenueChartProps {
    data: ChartData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0c12]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 min-w-[180px] animate-in fade-in zoom-in duration-200">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">{label}</p>
                <div className="space-y-3">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(entry.color,0.5)]"
                                    style={{ backgroundColor: entry.stroke }}
                                />
                                <span className="text-[11px] font-bold text-white/70 tracking-tight uppercase">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-[13px] font-black text-white font-mono">
                                {entry.name === 'revenue'
                                    ? `$${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    : entry.value
                                }
                            </span>
                        </div>
                    ))}
                </div>
                {/* Decorative bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#a4f8ff]/20 to-transparent" />
            </div>
        )
    }
    return null
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="h-[320px] w-full mt-4 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* Revenue Glow Gradient */}
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a4f8ff" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#a4f8ff" stopOpacity={0.01} />
                        </linearGradient>
                        {/* Orders Glow Gradient */}
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.02)"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.15)"
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        tick={{ fill: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}
                    />

                    {/* Left Axis - Revenue */}
                    <YAxis
                        yAxisId="left"
                        stroke="rgba(255,255,255,0.15)"
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        tick={{ fill: '#a4f8ff', opacity: 0.6 }}
                    />

                    {/* Right Axis - Orders */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="rgba(255,255,255,0.15)"
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dx={10}
                        tickFormatter={(v) => Number.isInteger(v) ? v : ''}
                        tick={{ fill: '#8b5cf6', opacity: 0.6 }}
                    />

                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} content={<CustomTooltip />} />

                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name="revenue"
                        stroke="#a4f8ff"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1500}
                        activeDot={{
                            r: 6,
                            stroke: '#a4f8ff',
                            strokeWidth: 2,
                            fill: '#0a0c12',
                            className: "shadow-[0_0_15px_rgba(164,248,255,0.5)]"
                        }}
                    />

                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        name="orders"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorOrders)"
                        animationDuration={1500}
                        activeDot={{
                            r: 6,
                            stroke: '#8b5cf6',
                            strokeWidth: 2,
                            fill: '#0a0c12',
                            className: "shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
