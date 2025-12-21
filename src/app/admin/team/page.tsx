"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Plus,
    User,
    Pencil,
    Shield, // Used for 'All Permissions' visualization if needed
    Trash,
    UserCircle,
    Copy, // For copying email if needed
    Loader2,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getTeamMembers, inviteMember, type TeamMember } from "@/lib/db/team"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [isInviting, setIsInviting] = useState(false)

    useEffect(() => {
        loadMembers()
    }, [])

    async function loadMembers() {
        try {
            const data = await getTeamMembers()
            setMembers(data)
        } catch (error) {
            console.error("Failed to load team members", error)
            toast.error("Failed to load team members")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleInvite() {
        if (!inviteEmail) return
        setIsInviting(true)
        try {
            await inviteMember(inviteEmail)
            toast.success("User invited/promoted successfully")
            setInviteEmail("")
            setIsInviteOpen(false)
            loadMembers()
        } catch (error: any) {
            toast.error(error.message || "Failed to invite user")
        } finally {
            setIsInviting(false)
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Team Members</h1>
                        <p className="text-sm text-white/40">Manage your shop team members and their permissions.</p>
                    </div>

                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand text-black font-bold hover:bg-brand/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Invite User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a1628] border-white/5 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Invite New Member</DialogTitle>
                                <DialogDescription className="text-white/40">
                                    Invite a new member to your team by entering their email address.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white">Email Address</label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-[#080c10] border-white/10"
                                    />
                                    <p className="text-[10px] text-white/40">
                                        The user must already have an account on the platform to be promoted.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button onClick={handleInvite} disabled={isInviting} className="bg-brand text-black font-bold hover:bg-brand/90">
                                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Invite
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Active Users</h2>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64 bg-[#0a1628] border border-white/5 rounded-2xl">
                            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                        </div>
                    ) : (
                        <div className="bg-[#0a1628] border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="p-6 text-xs font-bold text-white/40 uppercase tracking-wider">Username</th>
                                        <th className="p-6 text-xs font-bold text-white/40 uppercase tracking-wider">E-mail</th>
                                        <th className="p-6 text-xs font-bold text-white/40 uppercase tracking-wider">Role</th>
                                        <th className="p-6 text-xs font-bold text-white/40 uppercase tracking-wider">Permissions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-white/40 text-sm">
                                                No team members found.
                                            </td>
                                        </tr>
                                    ) : (
                                        members.map((member) => {
                                            const isOwner = member.role === 'admin' // In reality we'd check against a specific ID or owner flag
                                            // For this demo, let's treat the first user as Owner/Hansa if feasible, or just map 'admin' to 'Member' generally
                                            // mocking the role display based on email for the demo effect if needed,
                                            // but generally we just show 'Admin'.
                                            // Adjusting to screenshot logic:
                                            const displayRole = "Admin"
                                            const permissions = "All Permissions"

                                            return (
                                                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-6">
                                                        <span className="text-sm font-medium text-white">{member.full_name || member.email.split('@')[0]}</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="text-sm text-white/80">{member.email}</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white"
                                                        )}>
                                                            {displayRole}
                                                        </span>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-white/60">{permissions}</span>

                                                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand/80 transition-colors">
                                                                    <Pencil className="w-3 h-3" />
                                                                    Manage Permissions
                                                                </button>
                                                                <button className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors">
                                                                    <UserCircle className="w-3 h-3" />
                                                                    Transfer Ownership
                                                                </button>
                                                                <button className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors">
                                                                    <Trash className="w-3 h-3" />
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
