"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Plus,
    User,
    Pencil,
    Shield,
    Trash,
    UserCircle,
    Loader2,
    X,
    AlertTriangle,
    Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getTeamMembers, inviteMember, removeMember, transferOwnership, updateMemberPermissions, type TeamMember } from "@/lib/db/team"
import { toast } from "@/components/ui/sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const AVAILABLE_PERMISSIONS = [
    { id: "products", label: "Manage Products" },
    { id: "orders", label: "Manage Orders" },
    { id: "customers", label: "View Customers" },
    { id: "settings", label: "Site Settings" },
    { id: "team", label: "Team Management" },
    { id: "payments", label: "Payment Settings" },
]

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [isInviting, setIsInviting] = useState(false)

    // Remove Dialog State
    const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
    const [isRemoving, setIsRemoving] = useState(false)

    // Transfer Dialog State
    const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null)
    const [isTransferring, setIsTransferring] = useState(false)

    // Permissions Dialog State
    const [permissionsTarget, setPermissionsTarget] = useState<TeamMember | null>(null)
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [isSavingPermissions, setIsSavingPermissions] = useState(false)

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

    async function handleRemove() {
        if (!removeTarget) return
        setIsRemoving(true)
        try {
            await removeMember(removeTarget.id)
            toast.success(`${removeTarget.email} has been removed from the team`)
            setRemoveTarget(null)
            loadMembers()
        } catch (error: any) {
            toast.error(error.message || "Failed to remove member")
        } finally {
            setIsRemoving(false)
        }
    }

    async function handleTransfer() {
        if (!transferTarget) return
        setIsTransferring(true)
        try {
            await transferOwnership(transferTarget.id)
            toast.success(`Ownership transferred to ${transferTarget.email}`)
            setTransferTarget(null)
        } catch (error: any) {
            toast.error(error.message || "Failed to transfer ownership")
        } finally {
            setIsTransferring(false)
        }
    }

    async function handleSavePermissions() {
        if (!permissionsTarget) return
        setIsSavingPermissions(true)
        try {
            await updateMemberPermissions(permissionsTarget.id, selectedPermissions)
            toast.success(`Permissions updated for ${permissionsTarget?.email}`)
            setPermissionsTarget(null)
            loadMembers() // Reload to reflect changes
        } catch (error: any) {
            toast.error(error.message || "Failed to save permissions")
        } finally {
            setIsSavingPermissions(false)
        }
    }

    function openPermissionsDialog(member: TeamMember) {
        setPermissionsTarget(member)
        // Load the member's actual permissions
        setSelectedPermissions(member.permissions || AVAILABLE_PERMISSIONS.map(p => p.id))
    }

    function togglePermission(id: string) {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
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
                                            const displayRole = "Admin"

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
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">
                                                                    {member.permissions?.length === AVAILABLE_PERMISSIONS.length
                                                                        ? "All Permissions"
                                                                        : `${member.permissions?.length || 0} of ${AVAILABLE_PERMISSIONS.length}`}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => openPermissionsDialog(member)}
                                                                    className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-muted)] hover:text-[var(--sa-accent)] transition-colors bg-white/5 rounded border border-white/5"
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                    Permissions
                                                                </button>
                                                                <button
                                                                    onClick={() => setTransferTarget(member)}
                                                                    className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-muted)] hover:text-amber-400 transition-colors bg-white/5 rounded border border-white/5"
                                                                >
                                                                    <UserCircle className="w-3 h-3" />
                                                                    Transfer
                                                                </button>
                                                                <button
                                                                    onClick={() => setRemoveTarget(member)}
                                                                    className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/5 rounded border border-rose-500/10"
                                                                >
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

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <AlertDialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="w-5 h-5" />
                            Remove Team Member
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            Are you sure you want to remove <span className="font-bold text-white">{removeTarget?.email}</span> from the admin team?
                            They will lose all administrative privileges but can still use the platform as a regular user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            disabled={isRemoving}
                            className="bg-rose-500 hover:bg-rose-600 text-white"
                        >
                            {isRemoving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Transfer Ownership Dialog */}
            <AlertDialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
                <AlertDialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
                            <UserCircle className="w-5 h-5" />
                            Transfer Ownership
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            Are you sure you want to transfer store ownership to <span className="font-bold text-white">{transferTarget?.email}</span>?
                            This action will give them full control over the store, including the ability to manage other team members.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTransfer}
                            disabled={isTransferring}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                        >
                            {isTransferring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Transfer Ownership
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permissions Dialog */}
            <Dialog open={!!permissionsTarget} onOpenChange={(open) => !open && setPermissionsTarget(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[var(--sa-accent)]" />
                            Edit Permissions
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            Configure access permissions for <span className="font-bold text-white">{permissionsTarget?.email}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                            <div
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                                    selectedPermissions.includes(perm.id)
                                        ? "bg-[var(--sa-accent)]/10 border-[var(--sa-accent)]/30"
                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}
                            >
                                <Label className="text-sm font-bold text-white cursor-pointer">{perm.label}</Label>
                                <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                    selectedPermissions.includes(perm.id)
                                        ? "bg-[var(--sa-accent)] border-[var(--sa-accent)]"
                                        : "border-white/20"
                                )}>
                                    {selectedPermissions.includes(perm.id) && <Check className="w-3 h-3 text-black" />}
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPermissionsTarget(null)} className="text-white/40 hover:text-white hover:bg-white/5">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSavePermissions}
                            disabled={isSavingPermissions}
                            className="bg-[var(--sa-accent)] text-black font-bold hover:bg-[var(--sa-accent-glow)]"
                        >
                            {isSavingPermissions && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Save Permissions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
