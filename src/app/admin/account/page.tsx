"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { createClient } from "@/lib/supabase/client"
import {
    User,
    Shield,
    Key,
    History,
    Settings,
    LogOut,
    Lock,
    Mail,
    Globe,
    Clock,
    Copy,
    RefreshCw,
    ShieldCheck,
    CircleAlert,
    CheckCircle2,
    Laptop,
    Smartphone,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    updateAdminProfile,
    changeAdminPassword,
    updateAdminPreferences,
    createAdminApiKey,
    revokeAdminApiKey,
    revokeAllAdminSessions,
    getAdminAuditLogs
} from "@/lib/actions/admin-account"
import { uploadAvatar, getAvatarUrl } from "@/lib/storage/actions"

export default function AdminAccountPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [preferences, setPreferences] = useState<any>(null)
    const [apiKeys, setApiKeys] = useState<any[]>([])
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadData()

        // Setup realtime for preferences
        const supabase = createClient()
        const channel = supabase
            .channel('admin_account_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'admin_preferences'
            }, () => loadData())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'audit_logs'
            }, () => loadAuditLogs())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function loadData() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUser(user)

        const [profileRes, prefRes, keysRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
            supabase.from("admin_preferences").select("*").eq("admin_id", user.id).maybeSingle(),
            supabase.from("admin_api_keys").select("*").eq("admin_id", user.id)
        ])

        setProfile(profileRes.data)
        setPreferences(prefRes.data?.settings || {
            default_view: "dashboard",
            realtime_notifications: true,
            dark_mode_lock: true
        })
        setApiKeys(keysRes.data || [])

        await loadAuditLogs()
        setIsLoading(false)
    }

    async function loadAuditLogs() {
        const res = await getAdminAuditLogs()
        if (res.success) setAuditLogs(res.logs)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateAdminProfile(formData)
        if (res.success) {
            toast.success("Profile updated successfully")
            loadData()
        } else {
            toast.error(res.error || "Failed to update profile")
        }
        setIsSaving(false)
    }

    async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newPass = formData.get("new_password") as string
        const confirmPass = formData.get("confirm_password") as string

        if (newPass !== confirmPass) {
            return toast.error("Passwords do not match")
        }

        setIsSaving(true)
        const res = await changeAdminPassword(formData)
        if (res.success) {
            toast.success("Password updated successfully")
                ; (e.target as HTMLFormElement).reset()
        } else {
            toast.error(res.error || "Failed to update password")
        }
        setIsSaving(false)
    }

    async function handlePreferenceToggle(key: string, currentValue: boolean) {
        const newSettings = { ...preferences, [key === 'rt' ? 'realtime_notifications' : 'dark_mode_lock']: !currentValue }
        const res = await updateAdminPreferences(newSettings)
        if (!res.success) {
            toast.error(res.error || "Failed to update preference")
        }
    }

    async function handleCreateApiKey() {
        const label = prompt("Enter a label for this API key:")
        if (!label) return

        const res = await createAdminApiKey(label, ["read", "write"])
        if (res.success) {
            toast.success("API key generated")
            loadData()
            // In a real app, show the key to the user only once here
            alert(`Your new API Key (Copy it now, it won't be shown again):\n\n${res.key}`)
        } else {
            toast.error(res.error || "Failed to generate API key")
        }
    }

    async function handleRevokeApiKey(id: string) {
        if (!confirm("Are you sure you want to revoke this API key?")) return
        const res = await revokeAdminApiKey(id)
        if (res.success) {
            toast.success("API key revoked")
            loadData()
        } else {
            toast.error(res.error || "Failed to revoke API key")
        }
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsSaving(true)
        try {
            const path = await uploadAvatar(file, user.id)
            const url = await getAvatarUrl(path)

            const formData = new FormData()
            formData.append("avatar_url", url)
            formData.append("display_name", profile?.full_name || "")

            await updateAdminProfile(formData)
            toast.success("Avatar updated")
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Failed to upload avatar")
        }
        setIsSaving(false)
    }

    if (isLoading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-6 h-6 animate-spin text-white/20" />
            </div>
        </AdminLayout>
    )

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Account Management</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Securely manage your administrative profile and settings</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--sa-accent-muted)] border border-[var(--sa-accent-glow)]">
                        <ShieldCheck className="w-3 h-3 text-[var(--sa-accent)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--sa-accent)]">Verified Admin</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile & Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="sa-card-premium p-6 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-[var(--sa-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-20 h-20 rounded-lg border border-white/10 bg-black/40 mb-4 overflow-hidden flex items-center justify-center group/avatar">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-[var(--sa-fg-dim)]" />
                                )}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Plus className="w-5 h-5 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isSaving} />
                                </label>
                            </div>

                            <h2 className="text-base font-black text-white uppercase tracking-tight">{profile?.full_name || "Admin User"}</h2>
                            <p className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest mt-1 mb-6">{user?.email}</p>

                            <div className="w-full space-y-2 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">
                                    <span>Status</span>
                                    <span className="text-[var(--sa-accent)]">Live</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">
                                    <span>Member Since</span>
                                    <span className="text-white/60">{new Date(profile?.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-[var(--sa-card)] border border-[var(--sa-border)]">
                                <p className="text-[8px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest mb-0.5">Active Sessions</p>
                                <p className="text-sm font-black text-white">01</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--sa-card)] border border-[var(--sa-border)]">
                                <p className="text-[8px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest mb-0.5">Logs Audit</p>
                                <p className="text-sm font-black text-white">{auditLogs.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Sections */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Settings */}
                        <section className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <User className="w-4 h-4 text-[var(--sa-accent)]" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Identity Matrix</h3>
                                </div>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-0.5">Full Name</label>
                                        <Input
                                            name="display_name"
                                            defaultValue={profile?.full_name}
                                            placeholder="Your Name"
                                            className="h-9 bg-black/40 border-white/5 rounded-lg text-xs font-bold text-white placeholder:text-white/10 focus:border-[var(--sa-accent-glow)] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-0.5">System Email</label>
                                        <Input
                                            value={user?.email}
                                            readOnly
                                            className="h-9 bg-black/20 border-white/5 rounded-lg text-xs font-medium text-[var(--sa-fg-muted)] cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving} className="h-8 px-5 bg-[var(--sa-accent)] text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(164,248,255,0.1)]">
                                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Profile"}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Security Section */}
                        <section className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2.5">
                                <Shield className="w-4 h-4 text-orange-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Security Protocol</h3>
                            </div>
                            <form onSubmit={handlePasswordChange} className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-0.5">New Password</label>
                                        <div className="relative">
                                            <Input
                                                name="new_password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-9 bg-black/40 border-white/5 rounded-lg text-xs font-bold text-white placeholder:text-white/10 focus:border-orange-400/30 transition-all pr-10"
                                                required
                                            />
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-0.5">Confirm Identity</label>
                                        <div className="relative">
                                            <Input
                                                name="confirm_password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-9 bg-black/40 border-white/5 rounded-lg text-xs font-bold text-white placeholder:text-white/10 focus:border-orange-400/30 transition-all pr-10"
                                                required
                                            />
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-orange-400/5 border border-orange-400/10 flex items-start gap-3">
                                    <CircleAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-white">Session Invalidation Alert</p>
                                        <p className="text-[10px] text-[var(--sa-fg-muted)] leading-relaxed">Updating your master key will instantly terminate all other active administrative sessions across every platform and device.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving} className="h-8 px-5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-orange-500/20 transition-all">
                                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Rotate Master Key"}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Preferences */}
                        <section className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2.5">
                                <Settings className="w-4 h-4 text-purple-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Terminal Preferences</h3>
                            </div>
                            <div className="p-2.5 space-y-1">
                                {[
                                    { id: 'rt', label: 'Realtime Data Matrix', desc: 'Sync state instantly across all network nodes', checked: preferences?.realtime_notifications },
                                    { id: 'dm', label: 'Photophobic Logic', desc: 'Enforce high-contrast dark environment', checked: preferences?.dark_mode_lock },
                                    { id: 'nd', label: 'Auditory Feedback', desc: 'Signal system events via audio cues', checked: true }
                                ].map(pref => (
                                    <div key={pref.id} className="flex items-center justify-between p-3.5 rounded-lg hover:bg-white/[0.02] transition-all group">
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-bold text-white group-hover:text-purple-400 transition-colors">{pref.label}</p>
                                            <p className="text-[9px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest leading-none">{pref.desc}</p>
                                        </div>
                                        <div
                                            onClick={() => handlePreferenceToggle(pref.id, !!pref.checked)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                                                pref.checked ? "bg-purple-500" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn("w-3.5 h-3.5 rounded-full bg-white shadow-lg transition-all duration-300", pref.checked ? "translate-x-4.5" : "translate-x-0")} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* API Keys */}
                        <section className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Key className="w-4 h-4 text-[var(--sa-accent)]" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Access Credentials</h3>
                                </div>
                                <Button
                                    onClick={handleCreateApiKey}
                                    className="h-7 bg-[var(--sa-accent)]/10 text-[var(--sa-accent)] border border-[var(--sa-accent-glow)] hover:bg-[var(--sa-accent)] hover:text-black text-[9px] font-black uppercase tracking-widest px-3"
                                >
                                    <Plus className="w-3 h-3 mr-1.5" />
                                    New Token
                                </Button>
                            </div>
                            <div className="p-4 space-y-2">
                                {apiKeys.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {apiKeys.map(key => (
                                            <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-bold text-white">{key.label}</p>
                                                    <code className="text-[9px] text-[var(--sa-fg-dim)] font-black uppercase tracking-tighter">{key.prefix}••••••••••••</code>
                                                </div>
                                                <Button
                                                    onClick={() => handleRevokeApiKey(key.id)}
                                                    variant="ghost"
                                                    className="h-7 px-2.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 text-[9px] font-black uppercase tracking-widest"
                                                >
                                                    Revoke
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 rounded-lg border border-dashed border-white/5 bg-black/10">
                                        <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest text-center">No structural keys found</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity */}
                        <section className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2.5">
                                <History className="w-4 h-4 text-green-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Event Horizon</h3>
                            </div>
                            <div className="p-0">
                                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {auditLogs.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {auditLogs.map(log => (
                                                <div key={log.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[11px] font-bold text-white group-hover:text-green-400 transition-colors capitalize">
                                                                {log.action.replace(/_/g, ' ')}
                                                            </p>
                                                            <span className="text-[8px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest py-0.5 px-1.5 bg-white/5 rounded leading-none">
                                                                {log.target_table}
                                                            </span>
                                                        </div>
                                                        <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase text-[var(--sa-fg-dim)]">
                                                        #{log.id.slice(0, 6)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">No spectral events recorded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </AdminLayout>
    )
}
