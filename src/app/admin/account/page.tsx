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
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Account Management</h1>
                        <p className="text-white/40 text-sm">Securely manage your administrative profile and settings.</p>
                    </div>
                    <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 py-1 px-4 text-xs font-black tracking-widest uppercase italic">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                        Admin Access Verified
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile & Overview */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Profile Card */}
                        <div className="bg-background border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-24 h-24 rounded-full border-4 border-white/5 bg-white/5 mb-6 overflow-hidden flex items-center justify-center group/avatar">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-white/20" />
                                )}
                                <label className="absolute inset-0 bg-background/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Plus className="w-6 h-6 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isSaving} />
                                </label>
                            </div>

                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase">{profile?.full_name || "Admin User"}</h2>
                            <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] mb-6">{user?.email}</p>

                            <div className="w-full space-y-3 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                                    <span>Status</span>
                                    <span className="text-brand-primary">Active</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                                    <span>Joined</span>
                                    <span className="text-white/60">{new Date(profile?.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-background border border-white/5 rounded-3xl p-6 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Sessions</p>
                                <p className="text-lg font-black text-white">1 Active</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Audit Logs</p>
                                <p className="text-lg font-black text-white">{auditLogs.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Sections */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Settings */}
                        <section className="bg-background border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-black text-white italic tracking-tight uppercase">Profile Settings</h3>
                                </div>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest italic ml-1">Display Name</label>
                                        <Input
                                            name="display_name"
                                            defaultValue={profile?.full_name}
                                            placeholder="Your Name"
                                            className="h-12 bg-background/40 border-white/5 rounded-xl text-white font-bold placeholder:text-white/10 focus:border-brand-primary/30 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest italic ml-1">Email Address</label>
                                        <Input
                                            value={user?.email}
                                            readOnly
                                            className="h-12 bg-background/20 border-white/5 rounded-xl text-white/40 cursor-not-allowed italic font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving} className="h-11 px-8 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all italic">
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Update Profile"}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Security Section */}
                        <section className="bg-background border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <h3 className="font-black text-white italic tracking-tight uppercase">Security & Password</h3>
                            </div>
                            <form onSubmit={handlePasswordChange} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest italic ml-1">New Password</label>
                                        <div className="relative">
                                            <Input
                                                name="new_password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-12 bg-background/40 border-white/5 rounded-xl text-white font-bold placeholder:text-white/10 focus:border-orange-400/30 transition-all pr-12"
                                                required
                                            />
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest italic ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Input
                                                name="confirm_password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-12 bg-background/40 border-white/5 rounded-xl text-white font-bold placeholder:text-white/10 focus:border-orange-400/30 transition-all pr-12"
                                                required
                                            />
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-orange-400/5 border border-orange-400/10 flex items-start gap-4">
                                    <CircleAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white">Security Recommendation</p>
                                        <p className="text-xs text-white/40 leading-relaxed">Changing your password will invalidate all other active sessions for this account. You will need to log back in on your other devices.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={isSaving} className="h-11 px-8 bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all italic">
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Update Password"}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Preferences */}
                        <section className="bg-background border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
                                <Settings className="w-5 h-5 text-purple-400" />
                                <h3 className="font-black text-white italic tracking-tight uppercase">Admin Preferences</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { id: 'rt', label: 'Realtime Dashboard Updates', desc: 'Sync data instantly without page refresh', checked: preferences?.realtime_notifications },
                                        { id: 'dm', label: 'Enforce Dark Mode', desc: 'Lock the admin UI to high-performance dark theme', checked: preferences?.dark_mode_lock },
                                        { id: 'nd', label: 'Sales Notifications', desc: 'Play sound effects when new orders are placed', checked: true }
                                    ].map(pref => (
                                        <div key={pref.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{pref.label}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">{pref.desc}</p>
                                            </div>
                                            <div
                                                onClick={() => handlePreferenceToggle(pref.id, !!pref.checked)}
                                                className={cn(
                                                    "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-500",
                                                    pref.checked ? "bg-purple-500" : "bg-white/10"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-500", pref.checked && "translate-x-6")} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* API Keys */}
                        <section className="bg-background border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Key className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-black text-white italic tracking-tight uppercase">API Keys</h3>
                                </div>
                                <Button
                                    onClick={handleCreateApiKey}
                                    size="sm"
                                    className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                    Generate Key
                                </Button>
                            </div>
                            <div className="p-8 space-y-6">
                                {apiKeys.length > 0 ? (
                                    <div className="space-y-3">
                                        {apiKeys.map(key => (
                                            <div key={key.id} className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-white">{key.label}</p>
                                                    <code className="text-[10px] text-white/20 font-black uppercase">{key.prefix}••••••••••••</code>
                                                </div>
                                                <Button
                                                    onClick={() => handleRevokeApiKey(key.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Revoke
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 rounded-2xl border-2 border-dashed border-white/5">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">No API keys found</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity */}
                        <section className="bg-background border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
                                <History className="w-5 h-5 text-green-400" />
                                <h3 className="font-black text-white italic tracking-tight uppercase">Account Activity</h3>
                            </div>
                            <div className="p-0">
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {auditLogs.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {auditLogs.map(log => (
                                                <div key={log.id} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                                            {log.action.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{log.target_table}</span>
                                                        </p>
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{new Date(log.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-white/5 text-white/20">
                                                        {log.id.slice(0, 8)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">No activity logs recorded</p>
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
