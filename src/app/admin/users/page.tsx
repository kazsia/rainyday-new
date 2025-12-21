"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, UserPlus, Mail, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [searchQuery])

    async function loadData() {
        setIsLoading(true)
        try {
            const { users, error } = await getCustomers(1, searchQuery)
            if (error) throw new Error(error)
            setUsers(users || [])
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Users</h1>
                        <p className="text-muted-foreground">Manage your customer base and permissions.</p>
                    </div>
                    <Button className="gap-2 font-bold glow-green">
                        <UserPlus className="w-5 h-5" />
                        Add User
                    </Button>
                </div>

                <Card className="bg-card border-white/5">
                    <CardHeader className="border-b border-white/5">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-10 bg-white/5 border-white/10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Orders</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                                    </TableRow>
                                ) : users.map((user) => (
                                    <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02]">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold">{user.full_name || "Guest"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                user.role === "admin" ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground",
                                                "border-none capitalize"
                                            )}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold">{user.order_count}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}

import { cn } from "@/lib/utils"
import { getCustomers } from "@/lib/actions/admin-customers"
import { useEffect, useState } from "react"
import { toast } from "sonner"
