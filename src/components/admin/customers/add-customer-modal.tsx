"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        password: ""
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.email || !formData.password) {
            toast.error("Email and password are required")
            return
        }

        setIsSubmitting(true)
        try {
            // Note: Since we are in the admin panel, we might need a specific server action 
            // to create a user without being logged out (standard Supabase signup logs you in).
            // We'll use a server action if we have one, or just hit a specific endpoint.

            const response = await fetch('/api/admin/customers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Failed to create customer")

            toast.success("Customer created successfully")
            onSuccess()
            onClose()
            setFormData({ email: "", full_name: "", password: "" })
        } catch (error: any) {
            console.error("Create customer error:", error)
            toast.error(error.message || "Failed to create customer")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-brand" />
                        Add New Customer
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-white/40">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="customer@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="bg-white/5 border-white/10 h-11 focus:ring-brand/20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-white/40">Full Name (Optional)</Label>
                        <Input
                            id="full_name"
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className="bg-white/5 border-white/10 h-11 focus:ring-brand/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-white/40">Initial Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="bg-white/5 border-white/10 h-11 focus:ring-brand/20"
                            required
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-white/40 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand text-black font-bold h-11 px-8 rounded-xl"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Customer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
