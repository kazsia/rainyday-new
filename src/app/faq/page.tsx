"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { HelpCircle } from "lucide-react"
import Link from "next/link"

const faqs = [
    {
        q: "Can I make payments using my preferred method?",
        a: "Yes, we support a wide range of payment methods, including popular fiat options like Credit Cards as well as various crypto currencies. This enables you to make payments using the method that is most convenient for you.",
    },
    {
        q: "Is it safe to make payments?",
        a: "Yes, we take security very seriously. We use advanced fraud prevention measures to protect against fraudulent transactions and we do not store sensitive payment information.",
    },
    {
        q: "How do I make a purchase?",
        a: "Making a purchase is easy. Simply browse the available products and add the ones you wish to purchase to your cart. When you are ready to checkout, you will be prompted to enter your payment information and complete the transaction.",
    },
    {
        q: "What is the return policy for purchases?",
        a: "The return policy for purchases will vary depending on the specific product being purchased. It is important to review the return policy for each product before making a purchase to ensure that you understand the terms and conditions.",
    },
    {
        q: "Do you offer bulk discounts?",
        a: "Yes, for many of our digital assets and services, we offer scaled pricing. Check the product page for specific bulk rates or contact support for enterprise inquiries.",
    },
    {
        q: "How fast is delivery?",
        a: "Digital products are delivered instantly to your email upon payment verification. For services, delivery times are specified on the product page.",
    }
]

export default function FAQPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter">
                        F.A.Q
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto">
                        Everything you need to know about Rainyday products, payments, and security.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                    {faqs.map((faq, i) => (
                        <div key={i} className="group flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all duration-300">
                                <HelpCircle className="w-6 h-6 text-white/20 group-hover:text-brand-primary transition-colors" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors duration-300 tracking-tight">
                                    {faq.q}
                                </h4>
                                <p className="text-white/40 text-[15px] leading-relaxed font-medium">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 p-12 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
                    <h3 className="text-2xl font-black text-white italic mb-4">Still have questions?</h3>
                    <p className="text-white/40 mb-8 max-w-md mx-auto">
                        Our support team is available 24/7 to help you with any inquiries you might have.
                    </p>
                    <Link
                        href="/support"
                        className="inline-flex items-center justify-center h-14 px-10 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </MainLayout>
    )
}
