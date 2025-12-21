"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface PayoutDialogProps {
    isOpen: boolean
    onClose: () => void
    currency: string
    balance: number
    onSuccess: () => void
}

export function PayoutDialog({ isOpen, onClose, currency, balance, onSuccess }: PayoutDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        amount: "",
        address: "",
        notes: ""
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.amount || !formData.address) {
            toast.error("Please fill in all required fields")
            return
        }

        const amount = parseFloat(formData.amount)
        if (amount > balance) {
            toast.error("Insufficient balance")
            return
        }

        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('crypto_payouts')
                .insert({
                    amount,
                    currency,
                    destination_address: formData.address,
                    notes: formData.notes,
                    status: 'completed' // In this admin tool, it acts as a record of a manual payout already done
                })

            if (error) throw error

            toast.success("Payout logged successfully")
            onSuccess()
            onClose()
            setFormData({ amount: "", address: "", notes: "" })
        } catch (error) {
            console.error("Payout error:", error)
            toast.error("Failed to log payout")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Log {currency} Payout</DialogTitle>
                    <DialogDescription className="text-white/40">
                        Record a manual payout. This does not execute an on-chain transaction.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="balance" className="text-xs font-black uppercase tracking-widest text-white/20">Available Balance</Label>
                        <div className="text-2xl font-mono font-medium text-brand">
                            {balance.toFixed(8)} {currency}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-white/40">Amount to Payout</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="any"
                            placeholder="0.00000000"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            className="bg-white/5 border-white/10 h-12 focus:ring-brand/20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-white/40">Destination Address</Label>
                        <Input
                            id="address"
                            placeholder={`Enter ${currency} address`}
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="bg-white/5 border-white/10 h-12 focus:ring-brand/20 font-mono text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-white/40">Internal Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Reason, batch ID, etc."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-white/5 border-white/10 min-h-[100px] resize-none focus:ring-brand/20"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-white/40 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand text-black font-bold h-11 px-8 rounded-xl"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm Payout
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
