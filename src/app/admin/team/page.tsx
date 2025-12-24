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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Team Members</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Manage shop administration and access control</p>
                    </div>

                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] border-none shadow-[0_0_15px_rgba(164,248,255,0.2)] uppercase tracking-widest px-4">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Invite User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[400px] p-0 overflow-hidden shadow-2xl">
                            <DialogHeader className="p-5 bg-black/20 border-b border-white/5">
                                <DialogTitle className="text-sm font-black uppercase tracking-widest">Invite New Member</DialogTitle>
                                <DialogDescription className="text-[11px] font-medium text-[var(--sa-fg-dim)]">
                                    Promote an existing user to the administration team.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Email Address</label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-black/40 border-white/5 h-9 text-xs focus:ring-0 focus:border-[var(--sa-accent-glow)] transition-all"
                                    />
                                    <p className="text-[9px] text-[var(--sa-fg-muted)] font-medium leading-tight">
                                        The user must already have an account on the platform to be promoted to admin.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter className="p-5 bg-black/20 border-t border-white/5 sm:justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button onClick={handleInvite} disabled={isInviting} className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] border-none shadow-[0_0_10px_rgba(164,248,255,0.1)] uppercase tracking-widest px-4">
                                    {isInviting && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                                    Invite
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[11px] font-black text-[var(--sa-fg-muted)] uppercase tracking-[0.2em]">Active Administrative Team</h2>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-48 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--sa-accent)]" />
                        </div>
                    ) : (
                        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black/20">
                                        <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Identity</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Contact</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Role</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Permissions & Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-[var(--sa-fg-dim)] text-[11px] font-medium">
                                                No administrative team members found.
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
                                                    <td className="px-5 py-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                                                                <User className="w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                                                            </div>
                                                            <span className="text-xs font-bold text-white uppercase tracking-tight">{member.full_name || member.email.split('@')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-2.5">
                                                        <span className="text-[11px] font-medium text-[var(--sa-fg-muted)]">{member.email}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5">
                                                        <span className="px-2 py-0.5 rounded bg-[var(--sa-accent-muted)] text-[var(--sa-accent)] border border-[var(--sa-accent-glow)] text-[9px] font-black uppercase tracking-widest">
                                                            {displayRole}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Shield className="w-3 h-3 text-[var(--sa-fg-dim)]" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">All Permissions</span>
                                                            </div>

                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-muted)] hover:text-[var(--sa-accent)] transition-colors bg-white/5 rounded border border-white/5">
                                                                    <Pencil className="w-3 h-3" />
                                                                    Permissions
                                                                </button>
                                                                <button className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-muted)] hover:text-amber-400 transition-colors bg-white/5 rounded border border-white/5">
                                                                    <UserCircle className="w-3 h-3" />
                                                                    Transfer
                                                                </button>
                                                                <button className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/5 rounded border border-rose-500/10">
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
