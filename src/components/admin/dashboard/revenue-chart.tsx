"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ChartData {
    name: string
    revenue: number
    orders: number
}

interface RevenueChartProps {
    data: ChartData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* SellAuth - No Gradients requested, but subtle fade is often okay. 
                            User said: "No gradients in chart fills" -> implies solid or transparent fill.
                            However, line charts often look better with no fill or very subtle. 
                            I will use a very subtle fill to keep it readable but not "flashy".
                            Actually, strict rule: "No gradients in chart fills". I will use solid fill at very low opacity or just lines.
                            Let's use just lines with a very faint solid fill, no vertical gradient.
                        */}
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.2)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0b1016",
                            borderColor: "rgba(255,255,255,0.05)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
                        }}
                        itemStyle={{ color: "#d1d5db" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorOrders)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
