"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    CreditCard,
    Bitcoin,
    Settings,
    Shield,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    Search,
    ChevronRight,
    Wallet,
    Zap,
    AlertCircle,
    Activity,
    Eye,
    EyeOff,
    ArrowUpRight,
    Edit2,
    Image as ImageIcon,
    Hash,
    Layers,
    ChevronLeft,
    Globe,
    Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getPaymentMethodsSettings, updatePaymentMethodsSettings, type PaymentMethodSettings } from "@/lib/db/payment-methods"
import { DEFAULT_GATEWAY_CONFIGS } from "@/lib/gateway-constants"
import { uploadAsset } from "@/lib/db/settings"
import { DEFAULT_CRYPTO_LIST } from "@/lib/crypto-constants"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

export default function AdminPaymentMethodsPage() {
    const [settings, setSettings] = useState<PaymentMethodSettings>({
        paypal_enabled: true,
        crypto_enabled: true,
        disabled_cryptos: [],
        crypto_configs: DEFAULT_CRYPTO_LIST,
        gateway_configs: DEFAULT_GATEWAY_CONFIGS
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // View state: 'grid', 'edit', or 'edit-gateway'
    const [view, setView] = useState<'grid' | 'edit' | 'edit-gateway'>('grid')
    const [editingCoinId, setEditingCoinId] = useState<string | null>(null)
    const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getPaymentMethodsSettings()
            setSettings(data)
        } catch (error) {
            toast.error("Failed to load settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave() {
        setIsSaving(true)
        try {
            await updatePaymentMethodsSettings(settings)
            toast.success("Settings synchronized successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleCryptoVisibility = (id: string) => {
        setSettings(prev => ({
            ...prev,
            disabled_cryptos: prev.disabled_cryptos.includes(id)
                ? prev.disabled_cryptos.filter(c => c !== id)
                : [...prev.disabled_cryptos, id]
        }))
    }

    const handleEditCoin = (id: string) => {
        setEditingCoinId(id)
        setView('edit')
    }

    const updateCoinProperty = (id: string, field: string, value: string) => {
        setSettings(prev => {
            const configs = Array.isArray(prev.crypto_configs) ? prev.crypto_configs : DEFAULT_CRYPTO_LIST
            return {
                ...prev,
                crypto_configs: configs.map(c =>
                    c.id === id ? { ...c, [field]: value } : c
                )
            }
        })
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 2MB)
        const MAX_SIZE = 2 * 1024 * 1024 // 2MB
        if (file.size > MAX_SIZE) {
            toast.error("File too large. Maximum size is 2MB.")
            return
        }

        setIsUploading(true)
        try {
            const url = await uploadAsset(file)
            if (url) {
                if (editingCoinId) {
                    updateCoinProperty(editingCoinId, 'icon', url)
                } else if (editingGatewayId) {
                    updateGatewayProperty(editingGatewayId, 'icon', url)
                }
                toast.success("Logo uploaded successfully")
            } else {
                toast.error("Failed to upload logo")
            }
        } catch (error) {
            toast.error("Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleEditGateway = (id: string) => {
        setEditingGatewayId(id)
        setView('edit-gateway')
    }

    const updateGatewayProperty = (id: string, field: string, value: string) => {
        setSettings(prev => {
            const gateways = Array.isArray(prev.gateway_configs) ? [...prev.gateway_configs] : [...DEFAULT_GATEWAY_CONFIGS]
            return {
                ...prev,
                gateway_configs: gateways.map(g =>
                    g.id === id ? { ...g, [field]: value } : g
                )
            }
        })
    }

    const gatewayConfigs = Array.isArray(settings.gateway_configs)
        ? [...settings.gateway_configs]
        : [...DEFAULT_GATEWAY_CONFIGS]
    const editingGateway = gatewayConfigs.find(g => g.id === editingGatewayId)

    // Ensure crypto_configs is a proper array with methods (spread to restore prototype)
    const cryptoConfigs = Array.isArray(settings.crypto_configs)
        ? [...settings.crypto_configs]
        : [...DEFAULT_CRYPTO_LIST]
    const editingCoin = cryptoConfigs.find(c => c.id === editingCoinId)

    const filteredCryptos = cryptoConfigs.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--sa-accent)]" />
            </div>
        </AdminLayout>
    )

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            {(view === 'edit' || view === 'edit-gateway') && (
                                <button onClick={() => { setView('grid'); setEditingGatewayId(null); }} className="p-1 hover:bg-white/5 rounded-lg transition-colors mr-2">
                                    <ChevronLeft className="w-6 h-6 text-white/40" />
                                </button>
                            )}
                            {view === 'edit' ? `Edit ${editingCoin?.name}` : view === 'edit-gateway' ? `Edit ${editingGateway?.name}` : 'Payment Methods'}
                        </h1>
                        <p className="text-sm text-white/40 font-medium tracking-wide">
                            {view === 'edit' ? 'Configure specific asset properties and network logic' : view === 'edit-gateway' ? 'Configure gateway branding and display settings' : 'Manage your storefront payment gateways and assets'}
                        </p>
                    </div>
                    {view === 'grid' && (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-glow)] text-black font-bold h-10 px-6 rounded-xl transition-all"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {view === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            {/* Core Gateways */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {gatewayConfigs.map((gateway) => {
                                    const isPayPal = gateway.id === 'paypal'
                                    const isEnabled = isPayPal ? settings.paypal_enabled : settings.crypto_enabled

                                    return (
                                        <div key={gateway.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border"
                                                        style={{
                                                            backgroundColor: `${gateway.color}10`,
                                                            borderColor: `${gateway.color}30`
                                                        }}
                                                    >
                                                        <img
                                                            src={gateway.icon}
                                                            alt={gateway.name}
                                                            className="w-7 h-7 object-contain"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{gateway.name}</h3>
                                                        <p className="text-xs text-white/40">{gateway.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleEditGateway(gateway.id)}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <Switch
                                                        checked={isEnabled}
                                                        onCheckedChange={(val) => setSettings(prev => ({
                                                            ...prev,
                                                            [isPayPal ? 'paypal_enabled' : 'crypto_enabled']: val
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Asset Selection */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white tracking-tight uppercase">Individual Assets</h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <Input
                                            placeholder="SEARCH ASSETS..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-10 pl-10 w-64 bg-white/[0.02] border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredCryptos.map((coin: any) => {
                                        const isDisabled = settings.disabled_cryptos.includes(coin.id)
                                        return (
                                            <div
                                                key={coin.id}
                                                className={cn(
                                                    "group p-5 rounded-[1.5rem] border transition-all duration-300 relative",
                                                    isDisabled
                                                        ? "bg-black/40 border-white/5 opacity-40"
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                                                            <img src={coin.icon} alt={coin.name} className="w-6 h-6 object-contain" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white leading-tight">{coin.name}</h4>
                                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{coin.symbol} • {coin.network}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={!isDisabled}
                                                            onCheckedChange={() => toggleCryptoVisibility(coin.id)}
                                                            className="scale-75"
                                                        />
                                                        <button
                                                            onClick={() => handleEditCoin(coin.id)}
                                                            className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : view === 'edit' ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Asset Name</Label>
                                            <Input
                                                value={editingCoin?.name || ""}
                                                onChange={e => updateCoinProperty(editingCoinId!, 'name', e.target.value)}
                                                className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Symbol</Label>
                                            <Input
                                                value={editingCoin?.symbol || ""}
                                                onChange={e => updateCoinProperty(editingCoinId!, 'symbol', e.target.value)}
                                                className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Network</Label>
                                            <Input
                                                value={editingCoin?.network || ""}
                                                onChange={e => updateCoinProperty(editingCoinId!, 'network', e.target.value)}
                                                className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Logo</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {editingCoin?.icon ? (
                                                        <img src={editingCoin.icon} alt="Logo" className="w-10 h-10 object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={editingCoin?.icon || ""}
                                                        onChange={e => updateCoinProperty(editingCoinId!, 'icon', e.target.value)}
                                                        placeholder="https://..."
                                                        className="h-10 bg-black/40 border-white/10 text-white text-xs rounded-xl px-4"
                                                    />
                                                    <label className="flex items-center justify-center gap-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            className="sr-only"
                                                            disabled={isUploading}
                                                        />
                                                        {isUploading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                                                        ) : (
                                                            <Upload className="w-4 h-4 text-white/40" />
                                                        )}
                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                            {isUploading ? "Uploading..." : "Upload File"}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                                                <Eye className="w-5 h-5 text-white/40" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Visibility</h4>
                                                <p className="text-xs text-white/40 text-pretty">Toggle if this asset appears on the checkout page</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={!settings.disabled_cryptos.includes(editingCoinId!)}
                                            onCheckedChange={() => toggleCryptoVisibility(editingCoinId!)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setView('grid')}
                                    className="text-white/40 hover:text-white hover:bg-white/5 px-6 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setView('grid')}
                                    className="bg-white text-black hover:bg-white/90 font-bold px-8 rounded-xl"
                                >
                                    Finish Editing
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Edit Gateway View */
                        <motion.div
                            key="edit-gateway"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Gateway Name</Label>
                                            <Input
                                                value={editingGateway?.name || ""}
                                                onChange={e => updateGatewayProperty(editingGatewayId!, 'name', e.target.value)}
                                                className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Description</Label>
                                            <Input
                                                value={editingGateway?.description || ""}
                                                onChange={e => updateGatewayProperty(editingGatewayId!, 'description', e.target.value)}
                                                className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Brand Color</Label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={editingGateway?.color || "#000000"}
                                                    onChange={e => updateGatewayProperty(editingGatewayId!, 'color', e.target.value)}
                                                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                                                />
                                                <Input
                                                    value={editingGateway?.color || ""}
                                                    onChange={e => updateGatewayProperty(editingGatewayId!, 'color', e.target.value)}
                                                    placeholder="#000000"
                                                    className="h-12 bg-black/40 border-white/10 text-white font-bold rounded-xl px-4 flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Logo</Label>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden"
                                                    style={{
                                                        backgroundColor: `${editingGateway?.color}10` || '#00000010',
                                                        borderColor: `${editingGateway?.color}30` || '#00000030'
                                                    }}
                                                >
                                                    {editingGateway?.icon ? (
                                                        <img src={editingGateway.icon} alt="Logo" className="w-10 h-10 object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={editingGateway?.icon || ""}
                                                        onChange={e => updateGatewayProperty(editingGatewayId!, 'icon', e.target.value)}
                                                        placeholder="https://..."
                                                        className="h-10 bg-black/40 border-white/10 text-white text-xs rounded-xl px-4"
                                                    />
                                                    <label className="flex items-center justify-center gap-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            className="sr-only"
                                                            disabled={isUploading}
                                                        />
                                                        {isUploading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                                                        ) : (
                                                            <Upload className="w-4 h-4 text-white/40" />
                                                        )}
                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                            {isUploading ? "Uploading..." : "Upload File"}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setView('grid'); setEditingGatewayId(null); }}
                                    className="text-white/40 hover:text-white hover:bg-white/5 px-6 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => { setView('grid'); setEditingGatewayId(null); }}
                                    className="bg-white text-black hover:bg-white/90 font-bold px-8 rounded-xl"
                                >
                                    Finish Editing
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    )
}
