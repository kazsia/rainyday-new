"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail, Send, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { createTicket } from "@/lib/db/tickets"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CreateTicketPage() {
    const [subject, setSubject] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [message, setMessage] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!subject.trim() || !email.trim() || !message.trim()) {
            toast.error("Please fill in all fields")
            return
        }

        setIsSubmitting(true)
        try {
            await createTicket({
                subject,
                email,
                message
            })
            toast.success("Ticket created successfully! We will get back to you soon.")
            router.push("/support")
        } catch (error) {
            toast.error("Failed to create ticket. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16 max-w-2xl">
                <Link
                    href="/support"
                    className="inline-flex items-center text-white/40 hover:text-white mb-8 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Support
                </Link>

                <div className="mb-12 space-y-4">
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Submit a Ticket</h1>
                    <p className="text-white/40">Expected response time: less than 24 hours.</p>
                </div>

                <Card className="bg-background border-white/5 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 text-white/[0.02] -rotate-12">
                        <Mail size={160} />
                    </div>

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="How can we contact you?"
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What's this about?"
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue or question in detail..."
                                className="w-full min-h-[200px] bg-white/[0.02] border border-white/5 rounded-3xl p-6 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-16 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                "Submitting..."
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Ticket
                                </>
                            )}
                        </Button>
                    </form>
                </Card>
            </div>
        </MainLayout>
    )
}
