"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Filter } from "lucide-react"

const revenueData = [
    { name: "Jan", revenue: 4000, orders: 240 },
    { name: "Feb", revenue: 3000, orders: 198 },
    { name: "Mar", revenue: 2000, orders: 150 },
    { name: "Apr", revenue: 2780, orders: 210 },
    { name: "May", revenue: 1890, orders: 120 },
    { name: "Jun", revenue: 2390, orders: 170 },
    { name: "Jul", revenue: 3490, orders: 250 },
]

const categoryData = [
    { name: "Software", value: 400 },
    { name: "Assets", value: 300 },
    { name: "Service", value: 200 },
    { name: "Gaming", value: 100 },
]

const COLORS = ["#22c55e", "#10b981", "#059669", "#047857"]

export default function AdminAnalyticsPage() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Analytics</h1>
                        <p className="text-muted-foreground">Deep dive into your store's performance data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2 border-white/10">
                            <Calendar className="w-4 h-4" />
                            Last 30 Days
                        </Button>
                        <Button className="gap-2 font-bold glow-green">
                            <Download className="w-4 h-4" />
                            Download Report
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue vs Orders */}
                    <Card className="bg-card border-white/5">
                        <CardHeader>
                            <CardTitle>Revenue vs Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #ffffff10", borderRadius: "12px" }}
                                        itemStyle={{ color: "#22c55e" }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e" }} />
                                    <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Category Distribution */}
                    <Card className="bg-card border-white/5">
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #ffffff10", borderRadius: "12px" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="hidden md:block space-y-4 pr-8">
                                {categoryData.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-sm text-muted-foreground">{item.value} sales</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
