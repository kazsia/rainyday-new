"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Mail, HelpCircle, FileText, ShieldCheck, ArrowRight, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Support Center</h1>
                    <p className="text-white/40 max-w-md mx-auto">We're here to help you with any questions or issues you may have.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <Card className="bg-white/[0.02] border-white/5 hover:border-brand-primary/30 transition-all group rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-10 flex flex-col items-center text-center gap-6">
                            <div className="p-5 rounded-[1.5rem] bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-500">
                                <MessageCircle className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic mb-2">Live Chat</h3>
                                <p className="text-white/40 mb-8 text-sm leading-relaxed">Speak with our specialist agents in real-time for instant resolution.</p>
                                <Button className="w-full h-14 font-black uppercase tracking-widest bg-brand-primary text-black hover:bg-brand-accent rounded-2xl shadow-xl shadow-brand-primary/20">Start Chat</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/[0.02] border-white/5 hover:border-brand-primary/30 transition-all group rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-10 flex flex-col items-center text-center gap-6">
                            <div className="p-5 rounded-[1.5rem] bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-500">
                                <Mail className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic mb-2">Email Support</h3>
                                <p className="text-white/40 mb-8 text-sm leading-relaxed">Send us a ticket and our team will get back to you within 24 hours.</p>
                                <Link href="/support/ticket" className="w-full">
                                    <Button variant="outline" className="w-full h-14 border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-2xl">
                                        Send Email
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <Link href="/faq" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <HelpCircle className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white italic">F.A.Q</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Quick answers to the most common questions.</p>
                        </div>
                    </Link>
                    <Link href="/feedback" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <MessageCircle className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white italic">Feedback</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Share your experience and suggestions with us.</p>
                        </div>
                    </Link>
                    <Link href="/cart" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <ShoppingCart className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white italic">Cart Overview</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Review your items before proceeding to checkout.</p>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/terms" className="flex items-center justify-between p-8 rounded-[2rem] bg-[#0b1016] border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-bold text-white italic tracking-tight">Terms of Service</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/privacy" className="flex items-center justify-between p-8 rounded-[2rem] bg-[#0b1016] border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-bold text-white italic tracking-tight">Privacy Policy</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
            </div>
        </MainLayout>
    )
}
